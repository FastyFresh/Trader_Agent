const logger = require('../utils/logger');
const driftService = require('./drift');

class RiskManagementService {
    constructor(config = {}) {
        this.config = {
            maxDrawdown: 0.1, // 10% maximum drawdown
            maxLeverage: 5,
            targetLeverage: 3,
            rebalanceThreshold: 0.05, // 5% deviation triggers rebalancing
            liquidationBuffer: 0.2, // 20% buffer from liquidation price
            maxPositionSize: 0.2, // 20% of portfolio per position
            ...config
        };

        this.positions = new Map();
        this.portfolioValue = 0;
    }

    async initialize() {
        try {
            // Get initial portfolio value
            const account = await driftService.getAccount();
            this.portfolioValue = account.equity;
            
            // Load active positions
            const positions = await driftService.getOpenPositions();
            positions.forEach(position => {
                this.positions.set(position.marketIndex, position);
            });

            // Start monitoring
            this.startMonitoring();

            logger.info('Risk Management Service initialized');
        } catch (error) {
            logger.error('Failed to initialize risk management service:', error);
            throw error;
        }
    }

    startMonitoring() {
        // Monitor position updates
        driftService.drift.eventEmitter.on('positionUpdate', async (update) => {
            await this.handlePositionUpdate(update);
        });

        // Monitor mark price updates for liquidation prevention
        driftService.drift.eventEmitter.on('markPriceUpdate', async (update) => {
            await this.checkLiquidationRisk(update);
        });
    }

    async handlePositionUpdate(update) {
        try {
            this.positions.set(update.marketIndex, update);

            // Check if rebalancing is needed
            const totalRisk = this.calculateTotalRisk();
            if (totalRisk > this.config.maxDrawdown) {
                await this.rebalancePortfolio();
            }

            // Update position sizes if needed
            await this.adjustPositionSizes();

        } catch (error) {
            logger.error('Error handling position update:', error);
        }
    }

    calculateTotalRisk() {
        let totalRisk = 0;
        for (const position of this.positions.values()) {
            const leverage = position.leverage || 1;
            const positionSize = Math.abs(position.baseAssetAmount);
            const riskContribution = (positionSize * leverage) / this.portfolioValue;
            totalRisk += riskContribution;
        }
        return totalRisk;
    }

    async rebalancePortfolio() {
        try {
            const targetRiskPerPosition = this.config.maxDrawdown / this.positions.size;

            for (const position of this.positions.values()) {
                const currentRisk = this.calculatePositionRisk(position);
                
                if (Math.abs(currentRisk - targetRiskPerPosition) > this.config.rebalanceThreshold) {
                    await this.adjustPosition(position, targetRiskPerPosition);
                }
            }

            logger.info('Portfolio rebalanced');
        } catch (error) {
            logger.error('Error rebalancing portfolio:', error);
        }
    }

    calculatePositionRisk(position) {
        const leverage = position.leverage || 1;
        const positionSize = Math.abs(position.baseAssetAmount);
        return (positionSize * leverage) / this.portfolioValue;
    }

    async adjustPosition(position, targetRisk) {
        try {
            const currentRisk = this.calculatePositionRisk(position);
            const adjustmentFactor = targetRisk / currentRisk;
            
            const newSize = position.baseAssetAmount * adjustmentFactor;
            const sizeDiff = newSize - position.baseAssetAmount;

            if (Math.abs(sizeDiff) > 0) {
                await driftService.placePerpOrder({
                    marketIndex: position.marketIndex,
                    size: Math.abs(sizeDiff),
                    side: sizeDiff > 0 ? 'LONG' : 'SHORT',
                    orderType: 'MARKET',
                    reduceOnly: sizeDiff < 0
                });
            }

        } catch (error) {
            logger.error('Error adjusting position:', error);
        }
    }

    async checkLiquidationRisk(update) {
        try {
            const position = this.positions.get(update.marketIndex);
            if (!position) return;

            const liquidationPrice = position.liquidationPrice;
            const currentPrice = update.price;
            const buffer = Math.abs(liquidationPrice - currentPrice) / currentPrice;

            if (buffer < this.config.liquidationBuffer) {
                await this.preventLiquidation(position, currentPrice);
            }

        } catch (error) {
            logger.error('Error checking liquidation risk:', error);
        }
    }

    async preventLiquidation(position, currentPrice) {
        try {
            // Calculate safe leverage based on current price and liquidation buffer
            const currentLeverage = position.leverage;
            const safeLeverage = Math.max(1, currentLeverage * 0.7); // Reduce leverage by 30%

            // Adjust position
            await driftService.setLeverage(position.marketIndex, safeLeverage);

            // If still at risk, reduce position size
            const newBuffer = this.calculateLiquidationBuffer(position, currentPrice);
            if (newBuffer < this.config.liquidationBuffer) {
                const reduction = position.baseAssetAmount * 0.3; // Reduce size by 30%
                await driftService.placePerpOrder({
                    marketIndex: position.marketIndex,
                    size: reduction,
                    side: position.baseAssetAmount > 0 ? 'SHORT' : 'LONG',
                    orderType: 'MARKET',
                    reduceOnly: true
                });
            }

            logger.info(`Liquidation prevention measures taken for ${position.marketIndex}`);

        } catch (error) {
            logger.error('Error preventing liquidation:', error);
        }
    }

    calculateLiquidationBuffer(position, currentPrice) {
        const liquidationPrice = position.liquidationPrice;
        return Math.abs(liquidationPrice - currentPrice) / currentPrice;
    }

    async adjustPositionSizes() {
        try {
            for (const position of this.positions.values()) {
                const currentSize = Math.abs(position.baseAssetAmount) / this.portfolioValue;
                
                if (currentSize > this.config.maxPositionSize) {
                    const reduction = position.baseAssetAmount * 
                        (currentSize - this.config.maxPositionSize) / currentSize;

                    await driftService.placePerpOrder({
                        marketIndex: position.marketIndex,
                        size: Math.abs(reduction),
                        side: position.baseAssetAmount > 0 ? 'SHORT' : 'LONG',
                        orderType: 'MARKET',
                        reduceOnly: true
                    });
                }
            }
        } catch (error) {
            logger.error('Error adjusting position sizes:', error);
        }
    }

    getStatus() {
        return {
            portfolioValue: this.portfolioValue,
            totalRisk: this.calculateTotalRisk(),
            positions: Array.from(this.positions.values()).map(position => ({
                market: position.marketIndex,
                size: position.baseAssetAmount,
                leverage: position.leverage,
                risk: this.calculatePositionRisk(position)
            })),
            config: this.config
        };
    }
}

module.exports = new RiskManagementService();
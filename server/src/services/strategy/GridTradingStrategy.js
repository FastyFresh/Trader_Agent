const logger = require('../../utils/logger');
const driftService = require('../drift');

class GridTradingStrategy {
    constructor(config = {}) {
        this.config = {
            symbol: 'SOL-PERP',
            gridLevels: 10,
            gridSpacing: 0.02, // 2% between grid levels
            totalInvestment: 100, // Starting with $100
            leverage: 3,
            ...config
        };

        this.grids = [];
        this.activeOrders = new Map();
        this.initialized = false;
    }

    async initialize() {
        try {
            // Get current market price
            const marketData = await driftService.getMarketData(this.config.symbol);
            const currentPrice = marketData.market.currentPrice;

            // Calculate grid levels around current price
            const upperLevels = Math.floor(this.config.gridLevels / 2);
            const lowerLevels = this.config.gridLevels - upperLevels;

            // Calculate investment per grid
            const investmentPerGrid = this.config.totalInvestment / this.config.gridLevels;

            // Create grid levels
            for (let i = -lowerLevels; i <= upperLevels; i++) {
                const priceLevel = currentPrice * (1 + (i * this.config.gridSpacing));
                const size = (investmentPerGrid * this.config.leverage) / priceLevel;

                this.grids.push({
                    price: priceLevel,
                    buySize: size,
                    sellSize: size,
                    active: false
                });
            }

            this.initialized = true;
            logger.info(`Grid Trading Strategy initialized for ${this.config.symbol} with ${this.config.gridLevels} levels`);

        } catch (error) {
            logger.error('Failed to initialize grid trading strategy:', error);
            throw error;
        }
    }

    async start() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Place initial grid orders
            for (const grid of this.grids) {
                await this.placeGridOrders(grid);
            }

            // Start monitoring for order fills
            this.startMonitoring();

            logger.info('Grid trading strategy started');
        } catch (error) {
            logger.error('Failed to start grid trading strategy:', error);
            throw error;
        }
    }

    async placeGridOrders(grid) {
        try {
            // Place buy order at grid level
            const buyOrder = await driftService.placePerpOrder({
                marketIndex: this.config.symbol,
                price: grid.price,
                size: grid.buySize,
                side: 'LONG',
                orderType: 'LIMIT',
                reduceOnly: false
            });

            // Place sell order at next grid level
            const sellOrder = await driftService.placePerpOrder({
                marketIndex: this.config.symbol,
                price: grid.price * (1 + this.config.gridSpacing),
                size: grid.sellSize,
                side: 'SHORT',
                orderType: 'LIMIT',
                reduceOnly: true
            });

            // Track active orders
            this.activeOrders.set(buyOrder.orderId, {
                type: 'BUY',
                grid: grid,
                price: grid.price
            });

            this.activeOrders.set(sellOrder.orderId, {
                type: 'SELL',
                grid: grid,
                price: grid.price * (1 + this.config.gridSpacing)
            });

            grid.active = true;

        } catch (error) {
            logger.error('Failed to place grid orders:', error);
            throw error;
        }
    }

    startMonitoring() {
        // Subscribe to order updates
        driftService.drift.eventEmitter.on('orderUpdate', async (update) => {
            if (update.status === 'FILLED') {
                await this.handleOrderFill(update);
            }
        });

        // Monitor price movements for grid adjustments
        driftService.drift.eventEmitter.on('markPriceUpdate', async (update) => {
            await this.adjustGrids(update.price);
        });
    }

    async handleOrderFill(order) {
        const activeOrder = this.activeOrders.get(order.orderId);
        if (!activeOrder) return;

        try {
            // Remove filled order from tracking
            this.activeOrders.delete(order.orderId);

            // Place new grid orders
            if (activeOrder.type === 'BUY') {
                // Place sell order at profit level
                const sellPrice = order.price * (1 + this.config.gridSpacing);
                const sellOrder = await driftService.placePerpOrder({
                    marketIndex: this.config.symbol,
                    price: sellPrice,
                    size: order.size,
                    side: 'SHORT',
                    orderType: 'LIMIT',
                    reduceOnly: true
                });

                this.activeOrders.set(sellOrder.orderId, {
                    type: 'SELL',
                    grid: activeOrder.grid,
                    price: sellPrice
                });

            } else {
                // Place buy order at next lower level
                const buyPrice = order.price * (1 - this.config.gridSpacing);
                const buyOrder = await driftService.placePerpOrder({
                    marketIndex: this.config.symbol,
                    price: buyPrice,
                    size: order.size,
                    side: 'LONG',
                    orderType: 'LIMIT',
                    reduceOnly: false
                });

                this.activeOrders.set(buyOrder.orderId, {
                    type: 'BUY',
                    grid: activeOrder.grid,
                    price: buyPrice
                });
            }

        } catch (error) {
            logger.error('Error handling order fill:', error);
        }
    }

    async adjustGrids(currentPrice) {
        try {
            // Check if price has moved significantly outside our grid range
            const upperGrid = this.grids[this.grids.length - 1];
            const lowerGrid = this.grids[0];

            const priceAboveRange = currentPrice > upperGrid.price * (1 + this.config.gridSpacing);
            const priceBelowRange = currentPrice < lowerGrid.price * (1 - this.config.gridSpacing);

            if (priceAboveRange || priceBelowRange) {
                // Cancel all existing orders
                const cancelPromises = Array.from(this.activeOrders.keys()).map(orderId =>
                    driftService.cancelOrder(orderId)
                );
                await Promise.all(cancelPromises);

                // Reinitialize grids around new price
                this.grids = [];
                this.activeOrders.clear();
                await this.initialize();
                await this.start();

                logger.info('Grid levels adjusted to new price range');
            }

        } catch (error) {
            logger.error('Error adjusting grid levels:', error);
        }
    }

    async stop() {
        try {
            // Cancel all active orders
            const cancelPromises = Array.from(this.activeOrders.keys()).map(orderId =>
                driftService.cancelOrder(orderId)
            );
            await Promise.all(cancelPromises);

            this.activeOrders.clear();
            this.initialized = false;

            logger.info('Grid trading strategy stopped');
        } catch (error) {
            logger.error('Error stopping grid trading strategy:', error);
        }
    }

    getStatus() {
        return {
            symbol: this.config.symbol,
            gridLevels: this.config.gridLevels,
            activeOrders: this.activeOrders.size,
            grids: this.grids.map(grid => ({
                price: grid.price,
                active: grid.active
            })),
            totalInvestment: this.config.totalInvestment,
            leverage: this.config.leverage
        };
    }
}

module.exports = GridTradingStrategy;
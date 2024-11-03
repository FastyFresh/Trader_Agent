const logger = require('../utils/logger');
const Trade = require('../models/Trade');
const marketService = require('./market');

class StrategyManager {
    constructor() {
        this.strategies = new Map();
        this.runningStrategies = new Set();
    }

    async initialize() {
        try {
            // Initialize built-in strategies
            await this.setupDefaultStrategies();
            logger.info('Strategy Manager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Strategy Manager:', error);
            throw error;
        }
    }

    async setupDefaultStrategies() {
        const defaultStrategies = [
            {
                name: 'GridTrading',
                timeframe: '5m',
                description: 'Places buy and sell orders at regular price intervals',
                parameters: {
                    gridSpacing: 0.01, // 1% between grid levels
                    maxGrids: 10,
                    minProfit: 0.005, // 0.5% minimum profit per trade
                    maxExposure: 0.5 // Maximum 50% of available capital
                },
                symbols: ['SOL-PERP']
            },
            {
                name: 'MomentumTrading',
                timeframe: '15m',
                description: 'Follows strong price movements and trends',
                parameters: {
                    momentumPeriod: 14,
                    momentumThreshold: 0.02,
                    stopLoss: 0.015,
                    takeProfit: 0.03
                },
                symbols: ['SOL-PERP']
            }
        ];

        defaultStrategies.forEach(strategy => {
            this.strategies.set(strategy.name, strategy);
        });
    }

    async startStrategy(strategyName, symbol) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Strategy ${strategyName} not found`);
        }

        const key = `${strategyName}-${symbol}`;
        if (this.runningStrategies.has(key)) {
            logger.warn(`Strategy ${strategyName} already running for ${symbol}`);
            return;
        }

        this.runningStrategies.add(key);
        logger.info(`Started strategy ${strategyName} for ${symbol}`);

        return this.processStrategy(strategy, symbol);
    }

    async stopStrategy(strategyName, symbol) {
        const key = `${strategyName}-${symbol}`;
        if (this.runningStrategies.has(key)) {
            this.runningStrategies.delete(key);
            logger.info(`Stopped strategy ${strategyName} for ${symbol}`);
        }
    }

    async processStrategy(strategy, symbol) {
        try {
            // Get latest market data from Drift
            const marketData = await marketService.getCurrentPrices([symbol]);
            const currentPrice = marketData[symbol];

            if (!currentPrice) {
                throw new Error(`No price data available for ${symbol}`);
            }

            let signal = null;

            switch (strategy.name) {
                case 'GridTrading':
                    signal = await this.processGridStrategy(strategy, symbol, currentPrice);
                    break;
                case 'MomentumTrading':
                    signal = await this.processMomentumStrategy(strategy, symbol, currentPrice);
                    break;
                default:
                    logger.warn(`Unknown strategy type: ${strategy.name}`);
            }

            if (signal) {
                await this.executeSignal(strategy, symbol, signal, currentPrice);
            }

        } catch (error) {
            logger.error(`Error processing strategy ${strategy.name} for ${symbol}:`, error);
        }
    }

    async processGridStrategy(strategy, symbol, currentPrice) {
        const { gridSpacing, maxGrids } = strategy.parameters;
        
        // Calculate grid levels
        const gridLevels = [];
        for (let i = -maxGrids/2; i <= maxGrids/2; i++) {
            gridLevels.push(currentPrice * (1 + i * gridSpacing));
        }

        // Find closest grid levels
        const closestBuyGrid = gridLevels.filter(price => price < currentPrice)
            .sort((a, b) => b - a)[0];
        const closestSellGrid = gridLevels.filter(price => price > currentPrice)
            .sort((a, b) => a - b)[0];

        // Generate signal based on price position relative to grids
        if (Math.abs(currentPrice - closestBuyGrid) < gridSpacing * 0.1) {
            return {
                action: 'BUY',
                price: closestBuyGrid,
                reason: 'Price at buy grid level'
            };
        } else if (Math.abs(currentPrice - closestSellGrid) < gridSpacing * 0.1) {
            return {
                action: 'SELL',
                price: closestSellGrid,
                reason: 'Price at sell grid level'
            };
        }

        return null;
    }

    async processMomentumStrategy(strategy, symbol, currentPrice) {
        const { momentumPeriod, momentumThreshold } = strategy.parameters;
        
        // Get historical data
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (momentumPeriod * 15 * 60 * 1000));
        const historicalData = await marketService.getHistoricalData(symbol, '15m', startTime, endTime);

        if (historicalData.length < 2) {
            return null;
        }

        // Calculate momentum
        const momentum = (currentPrice - historicalData[0].close) / historicalData[0].close;

        // Generate signal based on momentum
        if (momentum > momentumThreshold) {
            return {
                action: 'BUY',
                price: currentPrice,
                reason: 'Strong upward momentum'
            };
        } else if (momentum < -momentumThreshold) {
            return {
                action: 'SELL',
                price: currentPrice,
                reason: 'Strong downward momentum'
            };
        }

        return null;
    }

    async executeSignal(strategy, symbol, signal, currentPrice) {
        try {
            const trade = new Trade({
                symbol,
                type: signal.action,
                price: currentPrice,
                strategy: strategy.name,
                metadata: {
                    reason: signal.reason
                }
            });

            await trade.save();
            logger.info(`Executed ${signal.action} signal for ${symbol} at ${currentPrice}`);

            return trade;
        } catch (error) {
            logger.error(`Failed to execute signal for ${symbol}:`, error);
            throw error;
        }
    }
}

module.exports = new StrategyManager();
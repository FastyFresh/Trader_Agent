const logger = require('../utils/logger');
const Trade = require('../models/Trade');
const tf = require('@tensorflow/tfjs-node');
const marketService = require('./market');

class StrategyManager {
    constructor() {
        this.strategies = new Map();
        this.models = new Map();
        this.runningStrategies = new Set();
    }

    async initialize() {
        try {
            // Initialize built-in strategies
            await this.setupDefaultStrategies();
            
            // Load ML models for each strategy
            await this.initializeModels();
            
            logger.info('Strategy Manager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Strategy Manager:', error);
            throw error;
        }
    }

    async setupDefaultStrategies() {
        const defaultStrategies = [
            {
                name: 'TrendFollowing',
                timeframe: '4h',
                description: 'Follows market trends using moving averages and momentum',
                parameters: {
                    shortPeriod: 9,
                    longPeriod: 21,
                    rsiPeriod: 14,
                    rsiOverbought: 70,
                    rsiOversold: 30,
                    stopLoss: 0.02, // 2%
                    takeProfit: 0.04 // 4%
                },
                symbols: ['BTC/USD', 'ETH/USD']
            },
            {
                name: 'MeanReversion',
                timeframe: '1h',
                description: 'Trades price reversals using Bollinger Bands and RSI',
                parameters: {
                    bollingerPeriod: 20,
                    bollingerStdDev: 2,
                    rsiPeriod: 14,
                    stopLoss: 0.015, // 1.5%
                    takeProfit: 0.03 // 3%
                },
                symbols: ['BTC/USD', 'ETH/USD']
            }
        ];

        defaultStrategies.forEach(strategy => {
            this.strategies.set(strategy.name, strategy);
        });
    }

    async initializeModels() {
        try {
            for (const [name, strategy] of this.strategies) {
                const model = await this.createModel(strategy);
                this.models.set(name, model);
            }
        } catch (error) {
            logger.error('Failed to initialize models:', error);
            throw error;
        }
    }

    async createModel(strategy) {
        const model = tf.sequential();
        
        model.add(tf.layers.lstm({
            units: 50,
            inputShape: [100, this.getInputFeatureCount(strategy)],
            returnSequences: true
        }));
        
        model.add(tf.layers.dropout(0.2));
        
        model.add(tf.layers.lstm({
            units: 50,
            returnSequences: false
        }));
        
        model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    getInputFeatureCount(strategy) {
        // Calculate number of input features based on strategy indicators
        let count = 2; // Price and volume are always included
        
        if (strategy.name === 'TrendFollowing') {
            count += 2; // SMA short and long
            count += 1; // RSI
        } else if (strategy.name === 'MeanReversion') {
            count += 3; // Bollinger Bands (upper, middle, lower)
            count += 1; // RSI
        }
        
        return count;
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

        // Subscribe to market data
        marketService.subscribeToMarketData(symbol, async (data) => {
            try {
                if (data.type === 'trade') {
                    await this.processMarketUpdate(strategy, symbol, data);
                }
            } catch (error) {
                logger.error(`Error processing market update for ${symbol}:`, error);
            }
        });

        logger.info(`Started strategy ${strategyName} for ${symbol}`);
    }

    async stopStrategy(strategyName, symbol) {
        const key = `${strategyName}-${symbol}`;
        if (this.runningStrategies.has(key)) {
            this.runningStrategies.delete(key);
            marketService.unsubscribeFromMarketData(symbol, this.processMarketUpdate);
            logger.info(`Stopped strategy ${strategyName} for ${symbol}`);
        }
    }

    async processMarketUpdate(strategy, symbol, data) {
        try {
            // Get historical data for analysis
            const historicalData = await marketService.getHistoricalData(
                symbol,
                strategy.timeframe,
                new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                new Date()
            );

            // Prepare features for model
            const features = await this.prepareFeatures(strategy, historicalData);
            
            // Get prediction from model
            const model = this.models.get(strategy.name);
            const prediction = await model.predict(features).data();

            // Generate trading signal
            const signal = this.generateSignal(
                strategy,
                prediction[0],
                data.price,
                historicalData
            );

            if (signal) {
                // Create and save trade
                const trade = new Trade({
                    symbol,
                    type: signal.action,
                    quantity: signal.quantity,
                    price: data.price,
                    strategy: strategy.name,
                    stopLoss: signal.stopLoss,
                    takeProfit: signal.takeProfit,
                    metadata: {
                        confidence: prediction[0],
                        marketConditions: {
                            volatility: signal.volatility,
                            trend: signal.trend,
                            volume: data.volume
                        }
                    }
                });

                await trade.save();
                logger.info(`Created new trade for ${symbol}:`, trade);
            }

        } catch (error) {
            logger.error(`Error processing market update for ${symbol}:`, error);
        }
    }

    async prepareFeatures(strategy, historicalData) {
        const features = [];
        
        // Calculate technical indicators based on strategy
        if (strategy.name === 'TrendFollowing') {
            const { shortPeriod, longPeriod, rsiPeriod } = strategy.parameters;
            
            features.push(
                this.calculateSMA(historicalData, shortPeriod),
                this.calculateSMA(historicalData, longPeriod),
                this.calculateRSI(historicalData, rsiPeriod)
            );
        } else if (strategy.name === 'MeanReversion') {
            const { bollingerPeriod, bollingerStdDev, rsiPeriod } = strategy.parameters;
            
            const bollinger = this.calculateBollingerBands(
                historicalData,
                bollingerPeriod,
                bollingerStdDev
            );
            features.push(...bollinger);
            features.push(this.calculateRSI(historicalData, rsiPeriod));
        }

        // Add price and volume
        features.push(
            historicalData.map(d => d.close),
            historicalData.map(d => d.volume)
        );

        return tf.tensor3d([features], [1, features.length, historicalData.length]);
    }

    generateSignal(strategy, confidence, currentPrice, historicalData) {
        if (confidence < 0.3 || confidence > 0.7) {
            const volatility = this.calculateVolatility(historicalData);
            const trend = this.calculateTrend(historicalData);

            return {
                action: confidence > 0.7 ? 'BUY' : 'SELL',
                quantity: this.calculatePositionSize(strategy, currentPrice),
                stopLoss: this.calculateStopLoss(strategy, currentPrice, confidence > 0.7),
                takeProfit: this.calculateTakeProfit(strategy, currentPrice, confidence > 0.7),
                confidence,
                volatility,
                trend
            };
        }

        return null;
    }

    // Technical indicator calculations
    calculateSMA(data, period) {
        const closes = data.map(d => d.close);
        const sma = [];
        
        for (let i = period - 1; i < closes.length; i++) {
            const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        
        return sma;
    }

    calculateRSI(data, period) {
        const closes = data.map(d => d.close);
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < closes.length; i++) {
            const difference = closes[i] - closes[i - 1];
            gains.push(Math.max(difference, 0));
            losses.push(Math.max(-difference, 0));
        }
        
        const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        return 100 - (100 / (1 + avgGain / avgLoss));
    }

    calculateBollingerBands(data, period, stdDev) {
        const closes = data.map(d => d.close);
        const sma = this.calculateSMA(data, period);
        const upperBand = [];
        const lowerBand = [];
        
        for (let i = period - 1; i < closes.length; i++) {
            const slice = closes.slice(i - period + 1, i + 1);
            const std = this.calculateStandardDeviation(slice);
            
            upperBand.push(sma[i - period + 1] + (std * stdDev));
            lowerBand.push(sma[i - period + 1] - (std * stdDev));
        }
        
        return [upperBand, sma, lowerBand];
    }

    calculateVolatility(data) {
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
        }
        
        return this.calculateStandardDeviation(returns) * Math.sqrt(252);
    }

    calculateTrend(data) {
        const prices = data.map(d => d.close);
        const smaShort = this.calculateSMA({ close: prices }, 10).slice(-1)[0];
        const smaLong = this.calculateSMA({ close: prices }, 30).slice(-1)[0];
        
        if (smaShort > smaLong) return 'UPTREND';
        if (smaShort < smaLong) return 'DOWNTREND';
        return 'SIDEWAYS';
    }

    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(variance);
    }

    calculatePositionSize(strategy, currentPrice) {
        // Implement position sizing based on strategy parameters
        // This is a simple implementation; you might want to use more sophisticated methods
        const baseSize = 0.1; // 10% of available capital
        return baseSize / currentPrice;
    }

    calculateStopLoss(strategy, currentPrice, isBuy) {
        const stopLossPercent = strategy.parameters.stopLoss;
        return isBuy
            ? currentPrice * (1 - stopLossPercent)
            : currentPrice * (1 + stopLossPercent);
    }

    calculateTakeProfit(strategy, currentPrice, isBuy) {
        const takeProfitPercent = strategy.parameters.takeProfit;
        return isBuy
            ? currentPrice * (1 + takeProfitPercent)
            : currentPrice * (1 - takeProfitPercent);
    }
}

module.exports = new StrategyManager();
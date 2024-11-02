const logger = require('../utils/logger');
const tf = require('@tensorflow/tfjs-node');

class StrategyManager {
    constructor() {
        this.strategies = new Map();
        this.models = new Map();
    }

    async initialize() {
        await this.loadStrategies();
        await this.initializeModels();
        logger.info('Strategy Manager initialized successfully');
    }

    async loadStrategies() {
        // Initialize default strategies
        const defaultStrategies = [
            {
                name: 'TrendFollowing',
                timeframe: '4h',
                indicators: ['SMA', 'EMA', 'RSI'],
                config: {
                    shortPeriod: 9,
                    longPeriod: 21,
                    rsiPeriod: 14,
                    rsiOverbought: 70,
                    rsiOversold: 30
                }
            },
            {
                name: 'MeanReversion',
                timeframe: '1h',
                indicators: ['Bollinger', 'MACD'],
                config: {
                    bollingerPeriod: 20,
                    bollingerStdDev: 2,
                    macdFast: 12,
                    macdSlow: 26,
                    macdSignal: 9
                }
            }
        ];

        defaultStrategies.forEach(strategy => {
            this.strategies.set(strategy.name, strategy);
        });

        return Array.from(this.strategies.values());
    }

    async initializeModels() {
        try {
            // Initialize ML models for each strategy
            for (const [name, strategy] of this.strategies) {
                const model = await this.createModel(strategy);
                this.models.set(name, model);
            }
        } catch (error) {
            logger.error('Failed to initialize strategy models:', error);
            throw error;
        }
    }

    async createModel(strategy) {
        const model = tf.sequential();
        
        // Add layers based on strategy requirements
        model.add(tf.layers.lstm({
            units: 50,
            inputShape: [100, strategy.indicators.length],
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

    async executeStrategy(strategy, marketData) {
        try {
            const model = this.models.get(strategy.name);
            if (!model) {
                throw new Error(`Model not found for strategy: ${strategy.name}`);
            }

            const features = this.prepareFeatures(strategy, marketData);
            const prediction = await model.predict(features).data();

            return this.generateSignal(strategy, prediction[0], marketData);

        } catch (error) {
            logger.error(`Strategy execution failed for ${strategy.name}:`, error);
            throw error;
        }
    }

    prepareFeatures(strategy, marketData) {
        const features = [];
        
        // Calculate technical indicators based on strategy configuration
        if (strategy.indicators.includes('SMA')) {
            features.push(this.calculateSMA(marketData.prices, strategy.config.shortPeriod));
            features.push(this.calculateSMA(marketData.prices, strategy.config.longPeriod));
        }
        
        if (strategy.indicators.includes('RSI')) {
            features.push(this.calculateRSI(marketData.prices, strategy.config.rsiPeriod));
        }
        
        if (strategy.indicators.includes('Bollinger')) {
            const bollinger = this.calculateBollinger(
                marketData.prices,
                strategy.config.bollingerPeriod,
                strategy.config.bollingerStdDev
            );
            features.push(...bollinger);
        }

        return tf.tensor3d([features], [1, features.length, strategy.indicators.length]);
    }

    generateSignal(strategy, prediction, marketData) {
        const signal = {
            timestamp: new Date(),
            strategy: strategy.name,
            confidence: prediction
        };

        if (prediction > 0.7) {
            signal.action = 'BUY';
            signal.price = marketData.price;
            signal.stopLoss = marketData.price * 0.98; // 2% stop loss
            signal.takeProfit = marketData.price * 1.04; // 4% take profit
        } else if (prediction < 0.3) {
            signal.action = 'SELL';
            signal.price = marketData.price;
            signal.stopLoss = marketData.price * 1.02;
            signal.takeProfit = marketData.price * 0.96;
        } else {
            signal.action = 'HOLD';
        }

        return signal;
    }

    // Technical indicator calculations
    calculateSMA(prices, period) {
        const sma = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }

    calculateRSI(prices, period) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < prices.length; i++) {
            const difference = prices[i] - prices[i - 1];
            gains.push(Math.max(difference, 0));
            losses.push(Math.max(-difference, 0));
        }
        
        const averageGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        const averageLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        const rsi = 100 - (100 / (1 + averageGain / averageLoss));
        return rsi;
    }

    calculateBollinger(prices, period, stdDev) {
        const sma = this.calculateSMA(prices, period);
        const upperBand = [];
        const lowerBand = [];
        
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const standardDeviation = this.calculateStandardDeviation(slice);
            
            upperBand.push(sma[i - period + 1] + (standardDeviation * stdDev));
            lowerBand.push(sma[i - period + 1] - (standardDeviation * stdDev));
        }
        
        return [upperBand, sma, lowerBand];
    }

    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDifferences = values.map(x => Math.pow(x - mean, 2));
        const variance = squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(variance);
    }
}

module.exports = StrategyManager;
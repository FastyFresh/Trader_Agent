const logger = require('../utils/logger');
const tf = require('@tensorflow/tfjs-node');

class RiskManager {
    constructor() {
        this.config = {
            maxPositionSize: 0.1, // 10% of portfolio
            stopLossPercentage: 0.02, // 2% stop loss
            maxDrawdown: 0.05, // 5% maximum drawdown
            volatilityThreshold: 0.15 // 15% volatility threshold
        };
        
        this.model = null;
    }

    async initialize(config = {}) {
        this.config = { ...this.config, ...config };
        await this.loadRiskModel();
        logger.info('Risk Manager initialized with config:', this.config);
    }

    async loadRiskModel() {
        try {
            // Initialize TensorFlow model for risk assessment
            this.model = tf.sequential();
            this.model.add(tf.layers.dense({
                units: 64,
                activation: 'relu',
                inputShape: [10] // Input features: price, volume, volatility, etc.
            }));
            this.model.add(tf.layers.dense({
                units: 32,
                activation: 'relu'
            }));
            this.model.add(tf.layers.dense({
                units: 1,
                activation: 'sigmoid'
            }));

            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            logger.info('Risk assessment model loaded successfully');
        } catch (error) {
            logger.error('Failed to load risk model:', error);
            throw error;
        }
    }

    async assessRisk({ strategy, marketData, portfolio }) {
        try {
            // Calculate position size based on portfolio value
            const positionSize = this.calculatePositionSize(portfolio, marketData);
            
            // Check if position size exceeds limits
            if (positionSize > this.config.maxPositionSize * portfolio.equity) {
                return {
                    isAcceptable: false,
                    reason: 'Position size exceeds maximum allowed'
                };
            }

            // Calculate volatility
            const volatility = this.calculateVolatility(marketData);
            if (volatility > this.config.volatilityThreshold) {
                return {
                    isAcceptable: false,
                    reason: 'Market volatility too high'
                };
            }

            // Prepare features for ML model
            const features = this.prepareFeatures(marketData, portfolio, strategy);
            const riskScore = await this.predictRisk(features);

            return {
                isAcceptable: riskScore < 0.7, // Threshold for acceptable risk
                riskScore,
                positionSize,
                volatility,
                stopLoss: this.calculateStopLoss(marketData.price)
            };

        } catch (error) {
            logger.error('Risk assessment failed:', error);
            throw error;
        }
    }

    calculatePositionSize(portfolio, marketData) {
        const { equity } = portfolio;
        const { price } = marketData;
        
        // Kelly Criterion implementation
        const winRate = 0.55; // Example win rate
        const payoffRatio = 1.5; // Example payoff ratio
        
        const kellyFraction = winRate - ((1 - winRate) / payoffRatio);
        const conservativeFraction = kellyFraction * 0.5; // Using half Kelly
        
        return equity * conservativeFraction / price;
    }

    calculateVolatility(marketData) {
        const { prices } = marketData;
        const returns = [];
        
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance * 252); // Annualized volatility
    }

    calculateStopLoss(currentPrice) {
        return currentPrice * (1 - this.config.stopLossPercentage);
    }

    prepareFeatures(marketData, portfolio, strategy) {
        // Convert market data and portfolio metrics into ML model features
        const features = [
            marketData.price,
            marketData.volume,
            this.calculateVolatility(marketData),
            portfolio.equity,
            portfolio.buyingPower,
            // Add more relevant features
        ];

        return tf.tensor2d([features], [1, features.length]);
    }

    async predictRisk(features) {
        try {
            const prediction = this.model.predict(features);
            const riskScore = await prediction.data();
            return riskScore[0];
        } catch (error) {
            logger.error('Risk prediction failed:', error);
            throw error;
        }
    }
}

module.exports = RiskManager;
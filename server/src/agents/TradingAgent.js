const { Alpaca } = require('@alpacahq/alpaca-trade-api');
const logger = require('../utils/logger');
const { BinanceClient } = require('../services/binance');
const { RiskManager } = require('./RiskManager');
const { StrategyManager } = require('./StrategyManager');

class TradingAgent {
    constructor(config) {
        this.alpaca = new Alpaca({
            keyId: process.env.ALPACA_API_KEY,
            secretKey: process.env.ALPACA_SECRET_KEY,
            paper: true
        });
        
        this.binance = new BinanceClient();
        this.riskManager = new RiskManager();
        this.strategyManager = new StrategyManager();
        
        this.config = {
            initialInvestment: 500,
            targetEquity: 1000000,
            maxDrawdown: 0.02, // 2% maximum drawdown
            timeHorizon: {
                min: 3, // years
                max: 5  // years
            },
            ...config
        };
    }

    async initialize() {
        try {
            await this.binance.connect();
            await this.loadStrategies();
            await this.setupRiskManagement();
            logger.info('Trading agent initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize trading agent:', error);
            throw error;
        }
    }

    async loadStrategies() {
        const strategies = await this.strategyManager.loadStrategies();
        this.activeStrategies = strategies;
    }

    async setupRiskManagement() {
        await this.riskManager.initialize({
            maxDrawdown: this.config.maxDrawdown,
            initialCapital: this.config.initialInvestment
        });
    }

    async executeStrategy(strategy, market) {
        try {
            // Get market data
            const marketData = await this.binance.getMarketData(market);
            
            // Run risk assessment
            const riskAssessment = await this.riskManager.assessRisk({
                strategy,
                marketData,
                portfolio: await this.getPortfolio()
            });

            if (!riskAssessment.isAcceptable) {
                logger.warn(`Risk assessment failed for ${market}:`, riskAssessment.reason);
                return null;
            }

            // Execute trade
            const signal = await strategy.generateSignal(marketData);
            if (signal) {
                const order = await this.executeOrder(signal);
                logger.info(`Order executed for ${market}:`, order);
                return order;
            }

        } catch (error) {
            logger.error(`Strategy execution failed for ${market}:`, error);
            throw error;
        }
    }

    async getPortfolio() {
        try {
            const account = await this.alpaca.getAccount();
            return {
                equity: parseFloat(account.equity),
                buyingPower: parseFloat(account.buying_power),
                cashBalance: parseFloat(account.cash),
                initialInvestment: this.config.initialInvestment
            };
        } catch (error) {
            logger.error('Failed to get portfolio:', error);
            throw error;
        }
    }

    async executeOrder(signal) {
        const { symbol, side, quantity, price } = signal;
        
        try {
            const order = await this.alpaca.createOrder({
                symbol,
                qty: quantity,
                side,
                type: 'limit',
                time_in_force: 'day',
                limit_price: price
            });

            return order;
        } catch (error) {
            logger.error('Order execution failed:', error);
            throw error;
        }
    }
}

module.exports = TradingAgent;
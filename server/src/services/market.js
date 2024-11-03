const logger = require('../utils/logger');
const Portfolio = require('../models/Portfolio');
const { withTransaction } = require('./database');
const driftService = require('./drift');

class MarketService {
    constructor() {
        this.marketDataSubscribers = new Map();
        this.priceUpdateInterval = null;
        this.driftService = driftService;
    }

    async initialize() {
        try {
            await this.driftService.initialize();
            logger.info('Market service initialized with Drift Protocol');
            
            // Start price update interval
            this.startPriceUpdateInterval();
        } catch (error) {
            logger.error('Failed to initialize market service:', error);
            throw error;
        }
    }

    async subscribeToDefaultSymbols() {
        const defaultSymbols = ['SOL-PERP'];
        logger.info(`Subscribed to symbols: ${defaultSymbols.join(', ')}`);
    }

    startPriceUpdateInterval() {
        // Update prices every minute
        this.priceUpdateInterval = setInterval(async () => {
            try {
                await this.updateAllPrices();
            } catch (error) {
                logger.error('Error updating prices:', error);
            }
        }, 60000);
    }

    async updateAllPrices() {
        return await withTransaction(async (session) => {
            try {
                // Get all unique symbols from portfolios
                const portfolios = await Portfolio.find({}, null, { session });
                const symbols = new Set();
                
                portfolios.forEach(portfolio => {
                    portfolio.positions.forEach(position => {
                        symbols.add(position.symbol);
                    });
                });

                // Get latest prices from Drift
                const prices = await this.getCurrentPrices(Array.from(symbols));

                // Update portfolio positions
                for (const portfolio of portfolios) {
                    let updated = false;
                    
                    portfolio.positions.forEach(position => {
                        const price = prices[position.symbol];
                        if (price) {
                            position.currentPrice = price;
                            position.marketValue = position.quantity * price;
                            updated = true;
                        }
                    });

                    if (updated) {
                        portfolio.totalEquity = portfolio.calculateTotalValue();
                        await portfolio.save({ session });
                    }
                }

            } catch (error) {
                logger.error('Failed to update prices:', error);
                throw error;
            }
        });
    }

    async getCurrentPrices(symbols) {
        try {
            const prices = {};
            
            for (const symbol of symbols) {
                try {
                    const marketData = await this.driftService.getMarketData(symbol);
                    prices[symbol] = marketData.currentPrice;
                } catch (error) {
                    logger.error(`Failed to get price for ${symbol}:`, error);
                }
            }

            return prices;
        } catch (error) {
            logger.error('Failed to fetch current prices:', error);
            throw error;
        }
    }

    async getHistoricalData(symbol, timeframe, startDate, endDate) {
        try {
            return await this.driftService.getHistoricalData(symbol, timeframe, startDate, endDate);
        } catch (error) {
            logger.error(`Failed to get historical data for ${symbol}:`, error);
            throw error;
        }
    }

    cleanup() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
    }
}

module.exports = new MarketService();
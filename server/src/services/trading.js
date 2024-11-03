const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const { withTransaction } = require('./database');
const logger = require('../utils/logger');

class TradingService {
    constructor() {
        this.defaultPortfolioId = 'main'; // We'll use a single portfolio for now
    }

    async getPortfolio() {
        try {
            let portfolio = await Portfolio.findOne({ _id: this.defaultPortfolioId });
            
            if (!portfolio) {
                // Create initial portfolio if it doesn't exist
                portfolio = new Portfolio({
                    _id: this.defaultPortfolioId,
                    totalEquity: 500, // Initial investment
                    cashBalance: 500,
                    positions: [],
                    performance: {
                        dailyReturn: 0,
                        weeklyReturn: 0,
                        monthlyReturn: 0,
                        yearlyReturn: 0,
                        allTimeReturn: 0
                    },
                    riskMetrics: {
                        portfolioBeta: 0,
                        valueAtRisk: 0,
                        marginUtilization: 0
                    }
                });
                await portfolio.save();
            }

            return portfolio;
        } catch (error) {
            logger.error('Error fetching portfolio:', error);
            throw error;
        }
    }

    async getActiveTrades() {
        try {
            return await Trade.find({ status: 'ACTIVE' })
                .sort({ timestamp: -1 })
                .limit(100);
        } catch (error) {
            logger.error('Error fetching active trades:', error);
            throw error;
        }
    }

    async executeTrade(tradeData) {
        return await withTransaction(async (session) => {
            try {
                const portfolio = await Portfolio.findOne(
                    { _id: this.defaultPortfolioId },
                    null,
                    { session }
                );

                if (!portfolio) {
                    throw new Error('Portfolio not found');
                }

                // Calculate trade value
                const tradeValue = tradeData.quantity * tradeData.price;

                // Verify sufficient funds for BUY orders
                if (tradeData.type === 'BUY' && tradeValue > portfolio.cashBalance) {
                    throw new Error('Insufficient funds');
                }

                // Create and save trade
                const trade = new Trade({
                    ...tradeData,
                    status: 'ACTIVE',
                    timestamp: new Date()
                });
                await trade.save({ session });

                // Update portfolio
                if (tradeData.type === 'BUY') {
                    portfolio.cashBalance -= tradeValue;
                    portfolio.positions.push({
                        symbol: tradeData.symbol,
                        quantity: tradeData.quantity,
                        averageEntryPrice: tradeData.price,
                        currentPrice: tradeData.price,
                        marketValue: tradeValue
                    });
                } else {
                    portfolio.cashBalance += tradeValue;
                    // Update or remove position
                    const positionIndex = portfolio.positions.findIndex(
                        p => p.symbol === tradeData.symbol
                    );
                    if (positionIndex >= 0) {
                        const position = portfolio.positions[positionIndex];
                        position.quantity -= tradeData.quantity;
                        if (position.quantity <= 0) {
                            portfolio.positions.splice(positionIndex, 1);
                        }
                    }
                }

                // Calculate new total equity
                portfolio.totalEquity = portfolio.calculateTotalValue();
                await portfolio.save({ session });

                return trade;
            } catch (error) {
                logger.error('Error executing trade:', error);
                throw error;
            }
        });
    }

    async updatePositionPrices(marketData) {
        try {
            const portfolio = await Portfolio.findOne({ _id: this.defaultPortfolioId });
            if (!portfolio) return;

            let updated = false;
            for (const position of portfolio.positions) {
                const price = marketData[position.symbol]?.price;
                if (price) {
                    position.currentPrice = price;
                    position.marketValue = position.quantity * price;
                    updated = true;
                }
            }

            if (updated) {
                portfolio.totalEquity = portfolio.calculateTotalValue();
                await portfolio.save();
            }
        } catch (error) {
            logger.error('Error updating position prices:', error);
            throw error;
        }
    }

    async getTradeHistory(symbol, startDate, endDate) {
        try {
            const query = { status: { $in: ['COMPLETED', 'CANCELLED'] } };
            if (symbol) query.symbol = symbol;
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = startDate;
                if (endDate) query.timestamp.$lte = endDate;
            }

            return await Trade.find(query)
                .sort({ timestamp: -1 })
                .limit(1000);
        } catch (error) {
            logger.error('Error fetching trade history:', error);
            throw error;
        }
    }

    async calculatePerformanceMetrics() {
        try {
            const portfolio = await Portfolio.findOne({ _id: this.defaultPortfolioId });
            if (!portfolio) return null;

            const now = new Date();
            const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

            // Get historical portfolio values
            const trades = await Trade.find({
                timestamp: { $gte: yearAgo },
                status: 'COMPLETED'
            }).sort({ timestamp: 1 });

            // Calculate returns
            const metrics = {
                currentValue: portfolio.totalEquity,
                initialInvestment: 500,
                absoluteReturn: portfolio.totalEquity - 500,
                percentageReturn: ((portfolio.totalEquity - 500) / 500) * 100,
                dailyReturn: 0,
                weeklyReturn: 0,
                monthlyReturn: 0,
                yearlyReturn: 0
            };

            // Update portfolio performance
            portfolio.performance = {
                dailyReturn: metrics.dailyReturn,
                weeklyReturn: metrics.weeklyReturn,
                monthlyReturn: metrics.monthlyReturn,
                yearlyReturn: metrics.yearlyReturn,
                allTimeReturn: metrics.percentageReturn
            };

            await portfolio.save();

            return metrics;
        } catch (error) {
            logger.error('Error calculating performance metrics:', error);
            throw error;
        }
    }
}

module.exports = new TradingService();
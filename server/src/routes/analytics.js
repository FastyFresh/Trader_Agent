const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const logger = require('../utils/logger');

router.get('/portfolio/history', async (req, res) => {
    try {
        const { timeframe } = req.query;
        const startDate = getStartDate(timeframe);
        
        const portfolioHistory = await Portfolio.find({
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 });

        const analyzedData = analyzePortfolioHistory(portfolioHistory);
        res.json(analyzedData);
    } catch (error) {
        logger.error('Error fetching portfolio history:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio history' });
    }
});

router.get('/trade/performance', async (req, res) => {
    try {
        const trades = await Trade.find({ status: 'EXECUTED' });
        const performance = analyzeTradePerformance(trades);
        res.json(performance);
    } catch (error) {
        logger.error('Error analyzing trade performance:', error);
        res.status(500).json({ error: 'Failed to analyze trade performance' });
    }
});

router.get('/strategy/performance', async (req, res) => {
    try {
        const { strategy } = req.query;
        let query = { status: 'EXECUTED' };
        
        if (strategy) {
            query.strategy = strategy;
        }

        const trades = await Trade.find(query);
        const performance = analyzeStrategyPerformance(trades);
        res.json(performance);
    } catch (error) {
        logger.error('Error analyzing strategy performance:', error);
        res.status(500).json({ error: 'Failed to analyze strategy performance' });
    }
});

router.get('/risk/metrics', async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne().sort({ timestamp: -1 });
        const trades = await Trade.find({ status: 'EXECUTED' });
        
        const riskMetrics = calculateRiskMetrics(portfolio, trades);
        res.json(riskMetrics);
    } catch (error) {
        logger.error('Error calculating risk metrics:', error);
        res.status(500).json({ error: 'Failed to calculate risk metrics' });
    }
});

// Helper functions
function getStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
        case 'day':
            return new Date(now.setDate(now.getDate() - 1));
        case 'week':
            return new Date(now.setDate(now.getDate() - 7));
        case 'month':
            return new Date(now.setMonth(now.getMonth() - 1));
        case 'year':
            return new Date(now.setFullYear(now.getFullYear() - 1));
        default:
            return new Date(now.setMonth(now.getMonth() - 1)); // Default to 1 month
    }
}

function analyzePortfolioHistory(history) {
    const analysis = {
        equityHistory: history.map(h => ({
            timestamp: h.timestamp,
            equity: h.totalEquity
        })),
        metrics: {
            returns: calculateReturns(history),
            volatility: calculateVolatility(history),
            sharpeRatio: calculateSharpeRatio(history),
            maxDrawdown: calculateMaxDrawdown(history)
        }
    };

    return analysis;
}

function analyzeTradePerformance(trades) {
    const performance = {
        totalTrades: trades.length,
        profitableTrades: trades.filter(t => t.calculatePnL() > 0).length,
        totalPnL: trades.reduce((sum, t) => sum + t.calculatePnL(), 0),
        winRate: 0,
        averageReturn: 0,
        profitFactor: 0
    };

    if (trades.length > 0) {
        performance.winRate = (performance.profitableTrades / trades.length) * 100;
        performance.averageReturn = performance.totalPnL / trades.length;
        
        const profits = trades.filter(t => t.calculatePnL() > 0)
                            .reduce((sum, t) => sum + t.calculatePnL(), 0);
        const losses = Math.abs(trades.filter(t => t.calculatePnL() < 0)
                            .reduce((sum, t) => sum + t.calculatePnL(), 0));
        
        performance.profitFactor = losses > 0 ? profits / losses : profits;
    }

    return performance;
}

function analyzeStrategyPerformance(trades) {
    const strategyMap = new Map();

    trades.forEach(trade => {
        if (!strategyMap.has(trade.strategy)) {
            strategyMap.set(trade.strategy, []);
        }
        strategyMap.get(trade.strategy).push(trade);
    });

    const performance = {};
    for (const [strategy, strategyTrades] of strategyMap) {
        performance[strategy] = {
            trades: analyzeTradePerformance(strategyTrades),
            metrics: {
                sharpeRatio: calculateTradesSharpeRatio(strategyTrades),
                maxDrawdown: calculateTradesMaxDrawdown(strategyTrades)
            }
        };
    }

    return performance;
}

function calculateRiskMetrics(portfolio, trades) {
    return {
        currentRisk: {
            valueAtRisk: calculateValueAtRisk(portfolio),
            portfolioBeta: calculatePortfolioBeta(portfolio),
            concentrationRisk: calculateConcentrationRisk(portfolio)
        },
        historicalRisk: {
            maxDrawdown: calculateMaxDrawdown(trades),
            volatility: calculateVolatility(trades),
            correlations: calculateCorrelations(trades)
        }
    };
}

// Additional calculation functions would be implemented here
function calculateReturns(history) {
    if (history.length < 2) return 0;
    const initial = history[0].totalEquity;
    const final = history[history.length - 1].totalEquity;
    return ((final - initial) / initial) * 100;
}

function calculateVolatility(history) {
    if (history.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < history.length; i++) {
        returns.push((history[i].totalEquity - history[i-1].totalEquity) / history[i-1].totalEquity);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized volatility
}

function calculateSharpeRatio(history) {
    const returns = calculateReturns(history);
    const volatility = calculateVolatility(history);
    const riskFreeRate = 0.02; // Assuming 2% risk-free rate
    
    return volatility === 0 ? 0 : (returns - riskFreeRate) / volatility;
}

function calculateMaxDrawdown(history) {
    if (history.length < 2) return 0;
    let maxDrawdown = 0;
    let peak = history[0].totalEquity;
    
    for (const point of history) {
        const drawdown = (peak - point.totalEquity) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
        peak = Math.max(peak, point.totalEquity);
    }
    
    return maxDrawdown * 100;
}

module.exports = router;
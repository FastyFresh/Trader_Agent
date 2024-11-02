const express = require('express');
const router = express.Router();
const RiskManager = require('../agents/RiskManager');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const logger = require('../utils/logger');

const riskManager = new RiskManager();

router.get('/assessment', async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne().sort({ timestamp: -1 });
        const trades = await Trade.find({ status: 'EXECUTED' })
                                .sort({ timestamp: -1 })
                                .limit(100);

        const assessment = await riskManager.assessRisk({
            portfolio,
            trades,
            marketData: await getMarketData()
        });

        res.json(assessment);
    } catch (error) {
        logger.error('Error performing risk assessment:', error);
        res.status(500).json({ error: 'Failed to perform risk assessment' });
    }
});

router.get('/exposure', async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne().sort({ timestamp: -1 });
        const exposureAnalysis = await analyzeExposure(portfolio);
        res.json(exposureAnalysis);
    } catch (error) {
        logger.error('Error analyzing exposure:', error);
        res.status(500).json({ error: 'Failed to analyze exposure' });
    }
});

router.get('/limits', async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne().sort({ timestamp: -1 });
        const trades = await Trade.find({ status: 'EXECUTED' });
        
        const riskLimits = calculateRiskLimits(portfolio, trades);
        res.json(riskLimits);
    } catch (error) {
        logger.error('Error calculating risk limits:', error);
        res.status(500).json({ error: 'Failed to calculate risk limits' });
    }
});

router.post('/update-limits', async (req, res) => {
    try {
        const { limits } = req.body;
        
        if (!limits) {
            return res.status(400).json({ error: 'Risk limits are required' });
        }

        const updatedLimits = await updateRiskLimits(limits);
        res.json(updatedLimits);
    } catch (error) {
        logger.error('Error updating risk limits:', error);
        res.status(500).json({ error: 'Failed to update risk limits' });
    }
});

// Helper functions
async function getMarketData() {
    // Implementation would fetch current market data
    // This is a placeholder
    return {
        prices: {},
        volatility: {},
        volume: {}
    };
}

async function analyzeExposure(portfolio) {
    const exposure = {
        totalExposure: 0,
        byAsset: {},
        byStrategy: {},
        concentration: {
            topPositions: [],
            diversificationScore: 0
        }
    };

    if (!portfolio) return exposure;

    // Calculate total exposure and exposure by asset
    portfolio.positions.forEach(position => {
        const positionValue = position.quantity * position.currentPrice;
        exposure.totalExposure += positionValue;
        exposure.byAsset[position.symbol] = {
            value: positionValue,
            percentage: (positionValue / portfolio.totalEquity) * 100
        };
    });

    // Calculate concentration metrics
    exposure.concentration.topPositions = Object.entries(exposure.byAsset)
        .sort(([,a], [,b]) => b.value - a.value)
        .slice(0, 5)
        .map(([symbol, data]) => ({
            symbol,
            ...data
        }));

    // Calculate diversification score (HHI - Herfindahl-Hirschman Index)
    const marketShares = Object.values(exposure.byAsset)
        .map(asset => Math.pow(asset.percentage / 100, 2));
    exposure.concentration.diversificationScore = 
        1 - marketShares.reduce((sum, share) => sum + share, 0);

    return exposure;
}

function calculateRiskLimits(portfolio, trades) {
    const equity = portfolio.totalEquity;
    
    // Calculate various risk limits based on portfolio size and trading history
    const limits = {
        maxPositionSize: equity * 0.1, // 10% of portfolio
        maxDrawdown: equity * 0.05, // 5% of portfolio
        dailyVaR: calculateVaR(trades, 0.95), // 95% VaR
        exposureLimits: {
            singleAsset: equity * 0.2, // 20% max exposure to single asset
            assetClass: equity * 0.4, // 40% max exposure to asset class
            strategy: equity * 0.3 // 30% max exposure to single strategy
        },
        stopLoss: {
            position: 0.02, // 2% per position
            daily: 0.05, // 5% daily
            weekly: 0.1 // 10% weekly
        }
    };

    return limits;
}

async function updateRiskLimits(newLimits) {
    // Validate and update risk limits
    // This would typically involve updating a configuration in the database
    return newLimits;
}

function calculateVaR(trades, confidence) {
    if (!trades || trades.length === 0) return 0;

    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < trades.length; i++) {
        const dailyReturn = (trades[i].price - trades[i-1].price) / trades[i-1].price;
        returns.push(dailyReturn);
    }

    // Sort returns
    returns.sort((a, b) => a - b);

    // Find VaR at specified confidence level
    const index = Math.floor(returns.length * (1 - confidence));
    return -returns[index];
}

module.exports = router;
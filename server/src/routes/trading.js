const express = require('express');
const router = express.Router();
const mockData = require('../mockData');
const logger = require('../utils/logger');

// Get portfolio overview
router.get('/portfolio', (req, res) => {
    try {
        res.json(mockData.portfolio);
    } catch (error) {
        logger.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

// Get performance metrics
router.get('/performance', (req, res) => {
    try {
        res.json(mockData.performanceData);
    } catch (error) {
        logger.error('Error fetching performance metrics:', error);
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
});

// Get active trades
router.get('/active-trades', (req, res) => {
    try {
        res.json(mockData.activeTrades);
    } catch (error) {
        logger.error('Error fetching active trades:', error);
        res.status(500).json({ error: 'Failed to fetch active trades' });
    }
});

// Get trading strategies
router.get('/strategies', (req, res) => {
    try {
        res.json(mockData.strategies);
    } catch (error) {
        logger.error('Error fetching strategies:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// Execute trade
router.post('/execute-trade', (req, res) => {
    try {
        const { strategy, market } = req.body;
        
        if (!strategy || !market) {
            return res.status(400).json({ error: 'Strategy and market parameters are required' });
        }

        // Simulate trade execution
        const trade = {
            id: Date.now().toString(),
            symbol: market,
            type: Math.random() > 0.5 ? 'BUY' : 'SELL',
            quantity: Math.random() * 0.1,
            entryPrice: 1000 + Math.random() * 100,
            strategy,
            timestamp: new Date().toISOString()
        };

        res.json(trade);
    } catch (error) {
        logger.error('Error executing trade:', error);
        res.status(500).json({ error: 'Failed to execute trade' });
    }
});

// Get market data
router.get('/market-data', (req, res) => {
    try {
        const { symbol, interval } = req.query;
        
        if (!symbol) {
            return res.status(400).json({ error: 'Symbol parameter is required' });
        }

        // Generate mock market data
        const data = {
            symbol,
            interval: interval || '1h',
            prices: Array.from({ length: 100 }, (_, i) => ({
                timestamp: new Date(Date.now() - i * 3600000).toISOString(),
                price: 1000 + Math.random() * 100,
                volume: Math.random() * 1000
            }))
        };

        res.json(data);
    } catch (error) {
        logger.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// Get risk assessment
router.get('/risk-assessment', (req, res) => {
    try {
        const { market } = req.query;
        
        if (!market) {
            return res.status(400).json({ error: 'Market parameter is required' });
        }

        // Generate mock risk assessment
        const assessment = {
            market,
            riskScore: Math.random(),
            metrics: {
                volatility: Math.random() * 20,
                exposure: Math.random() * 100,
                correlation: Math.random() * 2 - 1
            },
            recommendations: {
                maxPosition: Math.random() * 1000,
                stopLoss: Math.random() * 5,
                takeProfit: Math.random() * 10
            }
        };

        res.json(assessment);
    } catch (error) {
        logger.error('Error performing risk assessment:', error);
        res.status(500).json({ error: 'Failed to perform risk assessment' });
    }
});

module.exports = router;
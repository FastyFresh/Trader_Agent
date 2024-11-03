const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const tradingService = require('../services/trading');

// Get portfolio overview
router.get('/portfolio', async (req, res) => {
    try {
        const portfolio = await tradingService.getPortfolio();
        res.json(portfolio);
    } catch (error) {
        logger.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
    try {
        const performance = await tradingService.calculatePerformanceMetrics();
        res.json(performance);
    } catch (error) {
        logger.error('Error fetching performance metrics:', error);
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
});

// Get active trades
router.get('/active-trades', async (req, res) => {
    try {
        const trades = await tradingService.getActiveTrades();
        res.json(trades);
    } catch (error) {
        logger.error('Error fetching active trades:', error);
        res.status(500).json({ error: 'Failed to fetch active trades' });
    }
});

// Get trade history
router.get('/trade-history', async (req, res) => {
    try {
        const { symbol, startDate, endDate } = req.query;
        const trades = await tradingService.getTradeHistory(
            symbol,
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null
        );
        res.json(trades);
    } catch (error) {
        logger.error('Error fetching trade history:', error);
        res.status(500).json({ error: 'Failed to fetch trade history' });
    }
});

// Execute trade
router.post('/execute-trade', async (req, res) => {
    try {
        const { symbol, type, quantity, price, strategy } = req.body;
        
        if (!symbol || !type || !quantity || !price) {
            return res.status(400).json({ 
                error: 'Symbol, type, quantity, and price are required' 
            });
        }

        const trade = await tradingService.executeTrade({
            symbol,
            type,
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            strategy
        });

        res.json(trade);
    } catch (error) {
        logger.error('Error executing trade:', error);
        res.status(500).json({ error: error.message || 'Failed to execute trade' });
    }
});

// Update market data
router.post('/update-prices', async (req, res) => {
    try {
        const { marketData } = req.body;
        
        if (!marketData || typeof marketData !== 'object') {
            return res.status(400).json({ error: 'Market data is required' });
        }

        await tradingService.updatePositionPrices(marketData);
        res.json({ message: 'Prices updated successfully' });
    } catch (error) {
        logger.error('Error updating prices:', error);
        res.status(500).json({ error: 'Failed to update prices' });
    }
});

module.exports = router;
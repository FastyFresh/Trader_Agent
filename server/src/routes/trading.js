const express = require('express');
const router = express.Router();
const TradingAgent = require('../agents/TradingAgent');
const logger = require('../utils/logger');

const trader = new TradingAgent({
    initialInvestment: 500,
    targetEquity: 1000000
});

router.get('/portfolio', async (req, res) => {
    try {
        const portfolio = await trader.getPortfolio();
        res.json(portfolio);
    } catch (error) {
        logger.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

router.get('/performance', async (req, res) => {
    try {
        const portfolio = await trader.getPortfolio();
        const returns = {
            currentEquity: portfolio.equity,
            initialInvestment: trader.config.initialInvestment,
            absoluteReturn: portfolio.equity - trader.config.initialInvestment,
            percentageReturn: ((portfolio.equity - trader.config.initialInvestment) / 
                             trader.config.initialInvestment) * 100,
            progressToGoal: (portfolio.equity / trader.config.targetEquity) * 100
        };
        res.json(returns);
    } catch (error) {
        logger.error('Error fetching performance:', error);
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
});

router.post('/execute-trade', async (req, res) => {
    try {
        const { strategy, market } = req.body;
        
        if (!strategy || !market) {
            return res.status(400).json({ 
                error: 'Strategy and market parameters are required' 
            });
        }

        const result = await trader.executeStrategy(strategy, market);
        res.json(result);
    } catch (error) {
        logger.error('Error executing trade:', error);
        res.status(500).json({ error: 'Failed to execute trade' });
    }
});

router.get('/strategies', async (req, res) => {
    try {
        const strategies = await trader.strategyManager.loadStrategies();
        res.json(strategies);
    } catch (error) {
        logger.error('Error fetching strategies:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

router.post('/update-strategy', async (req, res) => {
    try {
        const { strategy, params } = req.body;
        
        if (!strategy || !params) {
            return res.status(400).json({ 
                error: 'Strategy name and parameters are required' 
            });
        }

        const updated = await trader.strategyManager.updateStrategy(strategy, params);
        res.json(updated);
    } catch (error) {
        logger.error('Error updating strategy:', error);
        res.status(500).json({ error: 'Failed to update strategy' });
    }
});

router.get('/risk-assessment', async (req, res) => {
    try {
        const { market } = req.query;
        
        if (!market) {
            return res.status(400).json({ 
                error: 'Market parameter is required' 
            });
        }

        const assessment = await trader.riskManager.assessRisk({
            market,
            portfolio: await trader.getPortfolio()
        });
        
        res.json(assessment);
    } catch (error) {
        logger.error('Error performing risk assessment:', error);
        res.status(500).json({ error: 'Failed to perform risk assessment' });
    }
});

router.get('/market-data', async (req, res) => {
    try {
        const { symbol, interval } = req.query;
        
        if (!symbol) {
            return res.status(400).json({ 
                error: 'Symbol parameter is required' 
            });
        }

        const marketData = await trader.binance.getMarketData(symbol, interval);
        res.json(marketData);
    } catch (error) {
        logger.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const strategyManager = require('../services/strategy');
const logger = require('../utils/logger');

// Get all available strategies
router.get('/', async (req, res) => {
    try {
        const strategies = Array.from(strategyManager.strategies.values());
        res.json(strategies);
    } catch (error) {
        logger.error('Error fetching strategies:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// Get specific strategy details
router.get('/:name', async (req, res) => {
    try {
        const strategy = strategyManager.strategies.get(req.params.name);
        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }
        res.json(strategy);
    } catch (error) {
        logger.error('Error fetching strategy:', error);
        res.status(500).json({ error: 'Failed to fetch strategy' });
    }
});

// Start a strategy for a symbol
router.post('/:name/start', async (req, res) => {
    try {
        const { symbol } = req.body;
        
        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        await strategyManager.startStrategy(req.params.name, symbol);
        res.json({ message: `Started strategy ${req.params.name} for ${symbol}` });
    } catch (error) {
        logger.error('Error starting strategy:', error);
        res.status(500).json({ error: 'Failed to start strategy' });
    }
});

// Stop a strategy for a symbol
router.post('/:name/stop', async (req, res) => {
    try {
        const { symbol } = req.body;
        
        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required' });
        }

        await strategyManager.stopStrategy(req.params.name, symbol);
        res.json({ message: `Stopped strategy ${req.params.name} for ${symbol}` });
    } catch (error) {
        logger.error('Error stopping strategy:', error);
        res.status(500).json({ error: 'Failed to stop strategy' });
    }
});

// Update strategy parameters
router.put('/:name', async (req, res) => {
    try {
        const { parameters } = req.body;
        const strategy = strategyManager.strategies.get(req.params.name);
        
        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }
        
        if (!parameters) {
            return res.status(400).json({ error: 'Parameters are required' });
        }

        // Update strategy parameters
        strategy.parameters = {
            ...strategy.parameters,
            ...parameters
        };

        strategyManager.strategies.set(req.params.name, strategy);
        res.json(strategy);
    } catch (error) {
        logger.error('Error updating strategy:', error);
        res.status(500).json({ error: 'Failed to update strategy' });
    }
});

// Get strategy performance
router.get('/:name/performance', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const performance = await strategyManager.getStrategyPerformance(
            req.params.name,
            start,
            end
        );

        if (!performance) {
            return res.status(404).json({ error: 'No performance data found' });
        }

        res.json(performance);
    } catch (error) {
        logger.error('Error fetching strategy performance:', error);
        res.status(500).json({ error: 'Failed to fetch strategy performance' });
    }
});

// Backtest a strategy
router.post('/:name/backtest', async (req, res) => {
    try {
        const { symbol, startDate, endDate, parameters } = req.body;
        
        if (!symbol || !startDate || !endDate) {
            return res.status(400).json({ 
                error: 'Symbol, start date, and end date are required' 
            });
        }

        const results = await strategyManager.backtest({
            strategyName: req.params.name,
            symbol,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            parameters
        });

        res.json(results);
    } catch (error) {
        logger.error('Error running backtest:', error);
        res.status(500).json({ error: 'Failed to run backtest' });
    }
});

// Get running strategies
router.get('/running/all', async (req, res) => {
    try {
        const runningStrategies = Array.from(strategyManager.runningStrategies)
            .map(key => {
                const [strategyName, symbol] = key.split('-');
                return {
                    strategy: strategyName,
                    symbol
                };
            });

        res.json(runningStrategies);
    } catch (error) {
        logger.error('Error fetching running strategies:', error);
        res.status(500).json({ error: 'Failed to fetch running strategies' });
    }
});

module.exports = router;
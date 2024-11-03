const express = require('express');
const router = express.Router();
const autoTrader = require('../services/AutoTrader');
const logger = require('../utils/logger');

// Initialize AutoTrader for a wallet
router.post('/initialize', async (req, res) => {
    try {
        const { walletPublicKey } = req.body;

        if (!walletPublicKey) {
            return res.status(400).json({ error: 'Wallet public key required' });
        }

        const initialized = await autoTrader.initialize(walletPublicKey);
        res.json({ success: initialized });
    } catch (error) {
        logger.error('Error initializing AutoTrader:', error);
        res.status(500).json({ error: 'Failed to initialize AutoTrader' });
    }
});

// Start trading
router.post('/start', async (req, res) => {
    try {
        const started = await autoTrader.start();
        res.json({ success: started });
    } catch (error) {
        logger.error('Error starting AutoTrader:', error);
        res.status(500).json({ error: 'Failed to start AutoTrader' });
    }
});

// Stop trading
router.post('/stop', async (req, res) => {
    try {
        const stopped = await autoTrader.stop();
        res.json({ success: stopped });
    } catch (error) {
        logger.error('Error stopping AutoTrader:', error);
        res.status(500).json({ error: 'Failed to stop AutoTrader' });
    }
});

// Get current status
router.get('/status', (req, res) => {
    try {
        const status = autoTrader.getStatus();
        res.json(status);
    } catch (error) {
        logger.error('Error getting AutoTrader status:', error);
        res.status(500).json({ error: 'Failed to get AutoTrader status' });
    }
});

module.exports = router;
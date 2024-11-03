const express = require('express');
const router = express.Router();
const { Connection, PublicKey } = require('@solana/web3.js');
const driftService = require('../services/drift');
const logger = require('../utils/logger');

// Get balance for wallet address
router.get('/:address', async (req, res) => {
    try {
        const connection = driftService.connection;
        const publicKey = new PublicKey(req.params.address);

        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / 1000000000; // Convert lamports to SOL

        res.json({ balance: solBalance });
    } catch (error) {
        logger.error('Error getting balance:', error);
        res.status(500).json({ error: 'Failed to get balance' });
    }
});

module.exports = router;
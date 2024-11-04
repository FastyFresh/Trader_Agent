const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const logger = require('./utils/logger');
const path = require('path');
const driftService = require('./services/drift');
const autoTrader = require('./services/AutoTrader');

const app = express();
const PORT = process.env.PORT || 4000; // Changed from 3000 to 4000

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });
logger.info('WebSocket server created');

// WebSocket connection handling
wss.on('connection', (ws) => {
    logger.info('Client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            logger.info('Received message:', data);
        } catch (error) {
            logger.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        logger.info('Client disconnected');
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API Routes
app.use('/api/autotrader', require('./routes/autoTrader'));
app.use('/api/balance', require('./routes/balance'));
app.use('/api/health', require('./routes/health'));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
server.listen(PORT, () => {
    logger.info(`HTTP server running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');
const tradingRoutes = require('./routes/trading');
const analyticsRoutes = require('./routes/analytics');
const riskRoutes = require('./routes/risk');
const logger = require('./utils/logger');
const mockData = require('./mockData');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trading', tradingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/risk', riskRoutes);

// WebSocket setup
io.on('connection', (socket) => {
    logger.info('Client connected');

    socket.on('subscribe_market', (symbol) => {
        logger.info(`Client subscribed to market: ${symbol}`);
        socket.join(`market:${symbol}`);

        // Start sending mock market updates
        const interval = setInterval(() => {
            const mockUpdate = {
                symbol,
                price: 1000 + Math.random() * 100,
                volume: Math.random() * 1000,
                timestamp: new Date().toISOString()
            };
            socket.emit('market_update', mockUpdate);
        }, 1000);

        socket.on('disconnect', () => {
            clearInterval(interval);
        });
    });

    socket.on('unsubscribe_market', (symbol) => {
        logger.info(`Client unsubscribed from market: ${symbol}`);
        socket.leave(`market:${symbol}`);
    });

    // Send mock portfolio updates
    const portfolioInterval = setInterval(() => {
        const mockPortfolio = {
            ...mockData.portfolio,
            totalEquity: mockData.portfolio.totalEquity * (1 + (Math.random() * 0.02 - 0.01)),
            timestamp: new Date().toISOString()
        };
        socket.emit('portfolio_update', mockPortfolio);
    }, 5000);

    socket.on('disconnect', () => {
        logger.info('Client disconnected');
        clearInterval(portfolioInterval);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
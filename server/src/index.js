const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');
const { setupDatabase } = require('./services/database');
const marketService = require('./services/market');
const strategyManager = require('./services/strategy');
const tradingRoutes = require('./routes/trading');
const strategyRoutes = require('./routes/strategy');
const analyticsRoutes = require('./routes/analytics');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5176",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trading', tradingRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.IO event handlers
io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id);

    // Subscribe to market updates
    socket.on('subscribe_market', (symbol) => {
        logger.info(`Client ${socket.id} subscribed to ${symbol}`);
        
        // Subscribe to market data
        marketService.subscribeToMarketData(symbol, (data) => {
            socket.emit('market_update', {
                symbol,
                data
            });
        });
    });

    // Unsubscribe from market updates
    socket.on('unsubscribe_market', (symbol) => {
        logger.info(`Client ${socket.id} unsubscribed from ${symbol}`);
        marketService.unsubscribeFromMarketData(symbol);
    });

    // Start trading strategy
    socket.on('start_strategy', async ({ strategy, symbol }) => {
        try {
            await strategyManager.startStrategy(strategy, symbol);
            socket.emit('strategy_status', {
                strategy,
                symbol,
                status: 'started'
            });
        } catch (error) {
            logger.error('Error starting strategy:', error);
            socket.emit('error', {
                type: 'strategy_error',
                message: error.message
            });
        }
    });

    // Stop trading strategy
    socket.on('stop_strategy', async ({ strategy, symbol }) => {
        try {
            await strategyManager.stopStrategy(strategy, symbol);
            socket.emit('strategy_status', {
                strategy,
                symbol,
                status: 'stopped'
            });
        } catch (error) {
            logger.error('Error stopping strategy:', error);
            socket.emit('error', {
                type: 'strategy_error',
                message: error.message
            });
        }
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize services and start server
async function startServer() {
    try {
        // Connect to MongoDB
        await setupDatabase();
        logger.info('Connected to MongoDB');

        // Initialize market service
        await marketService.initialize();
        logger.info('Market service initialized');

        // Initialize strategy manager
        await strategyManager.initialize();
        logger.info('Strategy manager initialized');

        // Start server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`WebSocket server available at ws://localhost:${PORT}`);
            logger.info(`REST API available at http://localhost:${PORT}/api`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
    logger.info('Shutting down server...');
    
    try {
        // Stop all running strategies
        const runningStrategies = Array.from(strategyManager.runningStrategies);
        for (const key of runningStrategies) {
            const [strategy, symbol] = key.split('-');
            await strategyManager.stopStrategy(strategy, symbol);
        }

        // Cleanup services
        marketService.cleanup();

        // Close server
        server.close(() => {
            logger.info('Server shut down successfully');
            process.exit(0);
        });

    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
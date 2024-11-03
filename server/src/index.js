const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const http = require('http');
const { setupDatabase } = require('./services/database');
const marketService = require('./services/market');
const strategyManager = require('./services/strategy');
const logger = require('./utils/logger');
const autoTrader = require('./services/AutoTrader');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5202",
    credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/health', require('./routes/health'));
app.use('/api/autotrader', require('./routes/autoTrader'));
app.use('/api/balance', require('./routes/balance'));

// Create HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    logger.info('New WebSocket connection established');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            logger.info('Received message:', data);

            // Handle different message types
            switch (data.type) {
                case 'subscribe_market':
                    marketService.subscribeToMarketData(data.symbol, (marketData) => {
                        ws.send(JSON.stringify({
                            type: 'market_update',
                            symbol: data.symbol,
                            data: marketData
                        }));
                    });
                    break;

                case 'start_trading':
                    autoTrader.start()
                        .then(() => {
                            ws.send(JSON.stringify({
                                type: 'trading_status',
                                status: 'started'
                            }));
                        })
                        .catch((error) => {
                            ws.send(JSON.stringify({
                                type: 'error',
                                error: error.message
                            }));
                        });
                    break;

                case 'stop_trading':
                    autoTrader.stop()
                        .then(() => {
                            ws.send(JSON.stringify({
                                type: 'trading_status',
                                status: 'stopped'
                            }));
                        })
                        .catch((error) => {
                            ws.send(JSON.stringify({
                                type: 'error',
                                error: error.message
                            }));
                        });
                    break;

                default:
                    logger.warn('Unknown message type:', data.type);
            }
        } catch (error) {
            logger.error('Error handling WebSocket message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Invalid message format'
            }));
        }
    });

    // Send initial market data
    ws.send(JSON.stringify({
        type: 'market_update',
        payload: {
            price: 60.5,
            change24h: 2.5,
            volume24h: 1000000,
            fundingRate: 0.0001
        }
    }));

    // Set up periodic market data updates
    const marketUpdateInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            const currentPrice = 60.5 + (Math.random() - 0.5) * 2;
            ws.send(JSON.stringify({
                type: 'market_update',
                payload: {
                    price: currentPrice,
                    change24h: ((currentPrice - 60.5) / 60.5) * 100,
                    volume24h: 1000000 + Math.random() * 500000,
                    fundingRate: 0.0001 + (Math.random() - 0.5) * 0.0001
                }
            }));
        }
    }, 5000);

    ws.on('close', () => {
        logger.info('WebSocket connection closed');
        clearInterval(marketUpdateInterval);
    });

    ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);
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

        // Initialize services
        await marketService.initialize();
        logger.info('Market service initialized');

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
        // Cleanup services
        if (marketService.cleanup) {
            marketService.cleanup();
        }

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
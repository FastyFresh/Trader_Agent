const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const logger = require('./utils/logger');
const marketService = require('./market');
const researchAgent = require('./agents/ResearchAgent');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/balance', require('./routes/balance'));
app.use('/api/autotrader', require('./routes/autoTrader'));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
  logger.info('New WebSocket connection established');

  // Handle incoming messages
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      logger.info('Received message:', data);

      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          handleSubscription(ws, data);
          break;
        case 'trade':
          handleTrade(ws, data);
          break;
        default:
          logger.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  // Send initial market data
  ws.send(JSON.stringify({
    type: 'market_update',
    data: generateMarketData()
  }));

  // Set up periodic updates
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'market_update',
        data: generateMarketData()
      }));
    }
  }, 5000);

  // Clean up on connection close
  ws.on('close', () => {
    clearInterval(interval);
    logger.info('WebSocket connection closed');
  });
});

function generateMarketData() {
  return {
    markets: [{
      symbol: 'SOL-PERP',
      price: 60 + (Math.random() - 0.5) * 2,
      change24h: (Math.random() - 0.5) * 5,
      volume24h: 1000000 + Math.random() * 500000,
      fundingRate: 0.0001 + (Math.random() - 0.5) * 0.0001
    }]
  };
}

function handleSubscription(ws, data) {
  logger.info('New subscription:', data);
  // Handle market data subscriptions
}

function handleTrade(ws, data) {
  logger.info('New trade:', data);
  // Handle trade execution
}

async function startServer(port) {
  try {
    // Initialize market service
    await marketService.initialize();
    logger.info('Market service initialized');

    // Initialize strategy manager
    logger.info('Strategy manager initialized');

    // Create HTTP server
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`WebSocket server available at ws://localhost:${port}`);
      logger.info(`REST API available at http://localhost:${port}/api`);
    });

    // Handle WebSocket upgrade
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    throw error;
  }
}

module.exports = { startServer };
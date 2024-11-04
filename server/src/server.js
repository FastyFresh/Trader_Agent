const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const logger = require('./utils/logger');
const marketService = require('./market');
const researchAgent = require('./agents/ResearchAgent');

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins temporarily for development
  credentials: true
}));
app.use(express.json());

// Debug route to check server status
app.get('/', (req, res) => {
  logger.info('Received request to root endpoint');
  res.json({ status: 'Server is running' });
});

// API Routes
app.get('/api/health', (req, res) => {
  logger.info('Health check request received');
  res.json({ status: 'ok' });
});

app.use('/api/balance', require('./routes/balance'));
app.use('/api/autotrader', require('./routes/autoTrader'));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Log active connections
let activeConnections = 0;

wss.on('connection', function connection(ws, request) {
  activeConnections++;
  logger.info(`New WebSocket connection established. Active connections: ${activeConnections}`);
  logger.info(`Connection request headers: ${JSON.stringify(request.headers)}`);

  try {
    // Send initial market data
    const marketData = generateMarketData();
    logger.info('Sending initial market data:', marketData);
    ws.send(JSON.stringify({
      type: 'market_update',
      data: marketData
    }));
  } catch (error) {
    logger.error('Error sending initial market data:', error);
  }

  // Handle incoming messages
  ws.on('message', function incoming(message) {
    try {
      logger.info('Raw message received:', message.toString());
      const data = JSON.parse(message);
      logger.info('Parsed message:', data);

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
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Unknown message type'
          }));
      }
    } catch (error) {
      logger.error('Error handling message:', error);
      try {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      } catch (sendError) {
        logger.error('Error sending error message:', sendError);
      }
    }
  });

  // Set up periodic updates
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const marketData = generateMarketData();
        logger.info('Sending periodic market update:', marketData);
        ws.send(JSON.stringify({
          type: 'market_update',
          data: marketData
        }));
      } catch (error) {
        logger.error('Error sending periodic update:', error);
      }
    }
  }, 5000);

  // Handle errors
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });

  // Clean up on connection close
  ws.on('close', () => {
    activeConnections--;
    clearInterval(interval);
    logger.info(`WebSocket connection closed. Active connections: ${activeConnections}`);
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
  try {
    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      data: {
        symbol: data.symbol,
        status: 'subscribed'
      }
    }));
  } catch (error) {
    logger.error('Error handling subscription:', error);
  }
}

function handleTrade(ws, data) {
  logger.info('New trade:', data);
  try {
    ws.send(JSON.stringify({
      type: 'trade_confirmed',
      data: {
        id: Date.now(),
        ...data
      }
    }));
  } catch (error) {
    logger.error('Error handling trade:', error);
  }
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
      logger.info('Received WebSocket upgrade request');
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
    });

    // Log server events
    server.on('error', (error) => {
      logger.error('Server error:', error);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    throw error;
  }
}

module.exports = { startServer };
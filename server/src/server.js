const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const researchAgent = require('./agents/ResearchAgent');
const driftService = require('./services/drift');
const WebSocket = require('ws');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5200'], // Updated to match the running client port
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/balance', require('./routes/balance'));
app.use('/api/autotrader', require('./routes/autoTrader'));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
  logger.info('New WebSocket connection established');

  ws.on('message', function incoming(message) {
    logger.info('Received WebSocket message:', message);
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

  // Simulate market updates
  setInterval(() => {
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
});

// Start research cycle
async function startResearch() {
    try {
        logger.info('Initializing research cycle...');

        // Initialize Drift service
        await driftService.initialize();
        logger.info('Drift service initialized');

        // Initialize and start research agent
        await researchAgent.initialize();
        logger.info('Research agent initialized');

        // Run research cycle
        const optimalStrategies = await researchAgent.researchOptimalStrategies();
        
        // Log research results
        logger.info('Research cycle completed');
        logger.info('Research Report:', JSON.stringify(researchAgent.getResearchReport(), null, 2));

        return optimalStrategies;
    } catch (error) {
        logger.error('Error in research cycle:', error);
        return null; // Return null instead of throwing to prevent server crash
    }
}

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`WebSocket server available at ws://localhost:${PORT}`);
    logger.info(`REST API available at http://localhost:${PORT}/api`);
    
    try {
        const strategies = await startResearch();
        if (strategies) {
            logger.info('Optimal strategies found:', strategies);
        }
    } catch (error) {
        logger.error('Failed to complete research cycle:', error);
    }
});

// Handle WebSocket upgrade
server.on('upgrade', function upgrade(request, socket, head) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
    });
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
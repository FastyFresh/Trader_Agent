const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const logger = require('./utils/logger');
const marketService = require('./market');

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins temporarily for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a basic server and WebSocket server
async function startServer(port) {
  try {
    await marketService.initialize();
    logger.info('Market service initialized');

    logger.info('Starting server...');
    
    const server = express()
      .use((req, res) => res.send({ status: 'Server is running' }))
      .listen(port, () => {
        logger.info(`HTTP server running on port ${port}`);
      });

    // Create WebSocket server
    const wss = new WebSocket.Server({ server, path: '/ws' });
    logger.info('WebSocket server created');

    // Connection handling
    wss.on('connection', function connection(ws, req) {
      logger.info('New WebSocket connection from:', req.socket.remoteAddress);

      // Send immediate connection confirmation
      try {
        ws.send(JSON.stringify({
          type: 'connection_status',
          status: 'connected'
        }));
        logger.info('Sent connection confirmation');
      } catch (error) {
        logger.error('Error sending connection confirmation:', error);
      }

      // Handle incoming messages
      ws.on('message', function incoming(message) {
        try {
          const data = JSON.parse(message);
          logger.info('Received message:', data);

          // Echo the message back
          ws.send(JSON.stringify({
            type: 'echo',
            data: data
          }));
        } catch (error) {
          logger.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message'
          }));
        }
      });

      // Handle connection close
      ws.on('close', function close() {
        logger.info('Client disconnected');
      });

      // Handle errors
      ws.on('error', function error(err) {
        logger.error('WebSocket error:', err);
      });

      // Send periodic keepalive
      const intervalId = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }));
        }
      }, 30000);

      // Clean up interval on close
      ws.on('close', () => clearInterval(intervalId));
    });

    // Server error handling
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
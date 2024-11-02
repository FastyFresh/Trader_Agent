const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { setupSocket } = require('./services/socket');
const { initializeAgents } = require('./agents');
const { setupDatabase } = require('./services/database');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
async function initializeServices() {
    try {
        // Connect to database
        await setupDatabase();
        
        // Initialize trading agents
        await initializeAgents();
        
        // Start server
        const server = app.listen(port, () => {
            logger.info(`Server running on port ${port}`);
        });
        
        // Setup WebSocket
        setupSocket(server);
        
    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

// Routes
app.use('/api/trading', require('./routes/trading'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/risk', require('./routes/risk'));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

// Initialize application
initializeServices().catch(err => {
    logger.error('Failed to start application:', err);
    process.exit(1);
});

module.exports = app;
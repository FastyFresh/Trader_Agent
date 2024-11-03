const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const researchAgent = require('./agents/ResearchAgent');
const driftService = require('./services/drift');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/balance', require('./routes/balance'));
app.use('/api/autotrader', require('./routes/autoTrader'));

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
        console.log('Research Report:', JSON.stringify(researchAgent.getResearchReport(), null, 2));

        return optimalStrategies;
    } catch (error) {
        logger.error('Error in research cycle:', error);
        throw error;
    }
}

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`CORS enabled for development ports 5173-5176`);
    
    try {
        const strategies = await startResearch();
        logger.info('Optimal strategies found:', strategies);
    } catch (error) {
        logger.error('Failed to complete research cycle:', error);
    }
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
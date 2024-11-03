const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const researchAgent = require('./agents/ResearchAgent');
const driftService = require('./services/drift');

const app = express();

app.use(cors());
app.use(express.json());

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

// Start server and research
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);
    
    try {
        const strategies = await startResearch();
        logger.info('Optimal strategies found:', strategies);
    } catch (error) {
        logger.error('Failed to complete research cycle:', error);
    }
});

// API endpoint to get research results
app.get('/api/research/results', (req, res) => {
    const report = researchAgent.getResearchReport();
    res.json(report);
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
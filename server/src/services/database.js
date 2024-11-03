const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function setupDatabase() {
    try {
        // MongoDB connection URL - you can modify this to use a cloud-hosted MongoDB
        const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/trader_agent';

        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        logger.info('Connected to MongoDB successfully');

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

async function cleanup() {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (error) {
        logger.error('Error during MongoDB cleanup:', error);
        process.exit(1);
    }
}

module.exports = {
    setupDatabase
};
const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function setupDatabase() {
    try {
        const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/trader_agent';

        // Configure Mongoose settings
        mongoose.set('strictQuery', false);
        
        // Connect to MongoDB
        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });

        logger.info('Connected to MongoDB successfully');

        // Create indexes for better query performance
        await createIndexes();

        // Set up event listeners for database connection
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected successfully');
        });

        // Handle application termination
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

async function createIndexes() {
    try {
        // Get all model names
        const modelNames = mongoose.modelNames();
        
        for (const modelName of modelNames) {
            const Model = mongoose.model(modelName);
            
            // Create timestamp index for all collections
            if (Model.schema.path('timestamp')) {
                await Model.collection.createIndex({ timestamp: -1 });
                logger.info(`Created timestamp index for ${modelName}`);
            }
            
            // Create specific indexes based on model
            switch (modelName) {
                case 'Trade':
                    await Model.collection.createIndex({ symbol: 1 });
                    await Model.collection.createIndex({ status: 1 });
                    await Model.collection.createIndex({ strategy: 1 });
                    break;
                    
                case 'Portfolio':
                    await Model.collection.createIndex({ 'positions.symbol': 1 });
                    break;
                    
                // Add more model-specific indexes here
            }
        }
        
        logger.info('Database indexes created successfully');
    } catch (error) {
        logger.error('Error creating database indexes:', error);
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

// Database utilities
async function withTransaction(operations) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await operations(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

// Export database functions
module.exports = {
    setupDatabase,
    withTransaction
};
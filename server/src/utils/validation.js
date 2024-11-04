const logger = require('./logger');

function validateConfig(config) {
    try {
        if (!config) {
            throw new Error('Configuration object is required');
        }

        const requiredFields = ['initialCapital', 'targetEquity', 'timeHorizon'];
        for (const field of requiredFields) {
            if (!(field in config)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (typeof config.initialCapital !== 'number' || config.initialCapital <= 0) {
            throw new Error('initialCapital must be a positive number');
        }

        if (typeof config.targetEquity !== 'number' || config.targetEquity <= config.initialCapital) {
            throw new Error('targetEquity must be greater than initialCapital');
        }

        if (typeof config.timeHorizon !== 'number' || config.timeHorizon <= 0) {
            throw new Error('timeHorizon must be a positive number');
        }

        return true;
    } catch (error) {
        logger.error('Configuration validation failed:', error);
        return false;
    }
}

function validateGridConfig(config) {
    try {
        const defaultConfig = {
            symbol: 'SOL-PERP',
            gridLevels: 10,
            gridSpacing: 0.02,
            totalInvestment: 100,
            leverage: 3,
            maxConcurrentOrders: 20,
            emergencyStopLoss: 0.15,
            priceDeviationThreshold: 0.05,
            minProfitPerTrade: 0.003
        };

        // Merge with defaults
        const mergedConfig = { ...defaultConfig, ...config };

        // Validate required fields and types
        if (typeof mergedConfig.symbol !== 'string' || !mergedConfig.symbol) {
            throw new Error('symbol must be a non-empty string');
        }

        if (typeof mergedConfig.gridLevels !== 'number' || mergedConfig.gridLevels < 2) {
            throw new Error('gridLevels must be a number >= 2');
        }

        if (typeof mergedConfig.gridSpacing !== 'number' || mergedConfig.gridSpacing <= 0 || mergedConfig.gridSpacing >= 1) {
            throw new Error('gridSpacing must be a number between 0 and 1');
        }

        if (typeof mergedConfig.totalInvestment !== 'number' || mergedConfig.totalInvestment <= 0) {
            throw new Error('totalInvestment must be a positive number');
        }

        if (typeof mergedConfig.leverage !== 'number' || mergedConfig.leverage < 1) {
            throw new Error('leverage must be a number >= 1');
        }

        if (typeof mergedConfig.maxConcurrentOrders !== 'number' || mergedConfig.maxConcurrentOrders < mergedConfig.gridLevels) {
            throw new Error('maxConcurrentOrders must be >= gridLevels');
        }

        if (typeof mergedConfig.emergencyStopLoss !== 'number' || mergedConfig.emergencyStopLoss <= 0 || mergedConfig.emergencyStopLoss >= 1) {
            throw new Error('emergencyStopLoss must be a number between 0 and 1');
        }

        if (typeof mergedConfig.priceDeviationThreshold !== 'number' || mergedConfig.priceDeviationThreshold <= 0 || mergedConfig.priceDeviationThreshold >= 1) {
            throw new Error('priceDeviationThreshold must be a number between 0 and 1');
        }

        if (typeof mergedConfig.minProfitPerTrade !== 'number' || mergedConfig.minProfitPerTrade <= 0 || mergedConfig.minProfitPerTrade >= 1) {
            throw new Error('minProfitPerTrade must be a number between 0 and 1');
        }

        // Validate relationships between parameters
        if (mergedConfig.gridSpacing * mergedConfig.gridLevels >= 1) {
            throw new Error('gridSpacing * gridLevels must be < 1 to prevent excessive price range');
        }

        if (mergedConfig.minProfitPerTrade >= mergedConfig.gridSpacing) {
            throw new Error('minProfitPerTrade must be less than gridSpacing');
        }

        return mergedConfig;
    } catch (error) {
        logger.error('Grid configuration validation failed:', error);
        throw error;
    }
}

module.exports = {
    validateConfig,
    validateGridConfig
};
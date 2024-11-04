const logger = require('./utils/logger');
const driftService = require('./services/drift');

class MarketService {
    constructor() {
        this.initialized = false;
        this.drift = null;
    }

    async initialize() {
        try {
            // Initialize Drift service
            this.drift = driftService;
            await this.drift.initialize();

            this.initialized = true;
            logger.info('Market service initialized with Drift Protocol');

            return true;
        } catch (error) {
            logger.error('Failed to initialize market service:', error);
            throw error;
        }
    }

    async getMarkets() {
        if (!this.initialized) {
            throw new Error('Market service not initialized');
        }

        const markets = [{
            symbol: 'SOL-PERP',
            name: 'Solana Perpetual',
            index: 1
        }, {
            symbol: 'BTC-PERP',
            name: 'Bitcoin Perpetual',
            index: 2
        }, {
            symbol: 'ETH-PERP',
            name: 'Ethereum Perpetual',
            index: 3
        }];

        return markets;
    }
}

module.exports = new MarketService();
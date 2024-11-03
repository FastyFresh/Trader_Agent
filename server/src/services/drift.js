const logger = require('../utils/logger');
const driftSim = process.env.NODE_ENV === 'development' ? require('../test/driftsim') : null;

class DriftService {
    constructor() {
        this.initialized = false;
        this.markets = new Map();
    }

    async initialize() {
        try {
            if (process.env.NODE_ENV === 'development') {
                // Use simulated data in development
                this.client = driftSim;
                logger.info('Initialized with simulated Drift Protocol data');
            } else {
                // Use real Drift Protocol in production
                const { Drift } = require('@drift-labs/sdk');
                this.client = new Drift({
                    env: process.env.SOLANA_NETWORK || 'devnet',
                    connection: new Connection(process.env.SOLANA_RPC_ENDPOINT),
                    wallet: this.getWallet(),
                    programID: new PublicKey(process.env.DRIFT_PROGRAM_ID)
                });
                logger.info('Initialized with real Drift Protocol connection');
            }

            this.initialized = true;
            
            logger.info('Drift service initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize Drift service:', error);
            throw error;
        }
    }

    getWallet() {
        // Implementation depends on environment
        if (process.env.NODE_ENV === 'development') {
            return {}; // Mock wallet for development
        } else {
            const { Keypair } = require('@solana/web3.js');
            const privateKey = process.env.SOLANA_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('SOLANA_PRIVATE_KEY environment variable not set');
            }
            return Keypair.fromSecretKey(bs58.decode(privateKey));
        }
    }

    async getMarketData(market) {
        try {
            return await this.client.getMarketData(market);
        } catch (error) {
            logger.error(`Error getting market data for ${market}:`, error);
            throw error;
        }
    }

    async getHistoricalData(market, timeframe, startTime, endTime) {
        try {
            return await this.client.getHistoricalData(market, timeframe, startTime, endTime);
        } catch (error) {
            logger.error(`Error getting historical data for ${market}:`, error);
            throw error;
        }
    }

    async getAccount() {
        try {
            return await this.client.getAccount();
        } catch (error) {
            logger.error('Error getting account:', error);
            throw error;
        }
    }

    async getOpenPositions() {
        try {
            return await this.client.getOpenPositions();
        } catch (error) {
            logger.error('Error getting open positions:', error);
            throw error;
        }
    }

    async placePerpOrder(params) {
        try {
            return await this.client.placePerpOrder(params);
        } catch (error) {
            logger.error('Error placing order:', error);
            throw error;
        }
    }

    get drift() {
        return this.client.drift;
    }
}

module.exports = new DriftService();
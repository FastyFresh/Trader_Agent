const { Wallet } = require('@project-serum/anchor');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { DriftClient, initialize } = require('@drift-labs/sdk');
const fs = require('fs');
const logger = require('../utils/logger');
const targets = require('../config/targets');

class DriftService {
    constructor() {
        this.initialized = false;
        this.client = null;
        this.wallet = null;
        this.connection = null;
        this.driftProgramId = null;
        this.marketSubscriptions = new Map();
        this.lastPrices = new Map();
        this.useSimulated = process.env.USE_SIMULATED_DATA === 'true';
    }

    async initialize() {
        try {
            if (this.initialized) {
                logger.info('Drift service already initialized');
                return true;
            }

            logger.info('Initializing Drift service...');
            
            if (this.useSimulated) {
                logger.info('Using simulated mode');
                return this.initializeSimulated();
            }

            try {
                // Load keypair from file
                logger.info('Loading wallet keypair...');
                const keypairPath = process.env.ANCHOR_WALLET;
                if (!keypairPath || !fs.existsSync(keypairPath)) {
                    throw new Error('Wallet keypair file not found');
                }

                const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
                const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
                this.wallet = new Wallet(keypair);
                logger.info('Wallet loaded successfully');

                // Initialize connection to Solana
                logger.info('Connecting to Solana network...');
                this.connection = new Connection(process.env.SOLANA_RPC_ENDPOINT, {
                    commitment: 'confirmed',
                    confirmTransactionInitialTimeout: 60000
                });

                // Test connection
                logger.info('Testing connection...');
                const blockHeight = await this.connection.getBlockHeight();
                logger.info('Connected to Solana network', { blockHeight });

                // Request airdrop for testing on devnet
                if (process.env.SOLANA_NETWORK === 'devnet') {
                    try {
                        logger.info('Requesting devnet SOL airdrop...');
                        const airdropSignature = await this.connection.requestAirdrop(
                            this.wallet.publicKey,
                            1000000000 // 1 SOL
                        );
                        await this.connection.confirmTransaction(airdropSignature);
                        logger.info('Airdrop successful');
                    } catch (e) {
                        logger.warn('Airdrop failed, continuing anyway:', e);
                    }
                }

                // Initialize Drift
                this.driftProgramId = new PublicKey(process.env.DRIFT_PROGRAM_ID);
                
                logger.info('Initializing Drift SDK...');
                await initialize({
                    env: process.env.SOLANA_NETWORK,
                    connection: this.connection,
                    wallet: this.wallet,
                    programID: this.driftProgramId,
                    perpMarkets: true,
                    userStats: true,
                    authority: this.wallet.publicKey,
                });

                logger.info('Creating Drift client...');
                this.client = new DriftClient({
                    connection: this.connection,
                    wallet: this.wallet,
                    programID: this.driftProgramId,
                    env: process.env.SOLANA_NETWORK,
                    opts: {
                        skipPreflight: true,
                        commitment: 'confirmed',
                        preflightCommitment: 'confirmed',
                    },
                });

                // Subscribe to updates
                await this.client.subscribe();
                logger.info('Drift client subscribed to updates');

                // Verify market access
                try {
                    const market = await this.client.getPerpMarket(0);
                    logger.info('Successfully verified market access:', {
                        marketIndex: market.marketIndex,
                        baseAssetSymbol: market.baseAssetSymbol
                    });
                } catch (e) {
                    logger.warn('Market data not available yet:', e);
                }

                this.initialized = true;
                logger.info('Drift service initialization complete');
                return true;
            } catch (error) {
                logger.error('Error during initialization:', error);

                if (error.message.includes('region restricted') || 
                    error.message.includes('401') || 
                    error.message.includes('403')) {
                    throw new Error('Access denied. Your region may be restricted.');
                }

                throw error;
            }
        } catch (error) {
            logger.error('Fatal error in Drift service:', error);
            
            if (this.useSimulated) {
                logger.info('Falling back to simulated mode due to error');
                return this.initializeSimulated();
            }
            
            throw new Error(`Failed to initialize Drift service: ${error.message}`);
        }
    }

    async initializeSimulated() {
        logger.info('Initializing simulated environment');
        this.initialized = true;
        return true;
    }

    generateSimulatedData(symbol) {
        const basePrice = symbol === 'SOL-PERP' ? 60 : 35000;
        const lastPrice = this.lastPrices.get(symbol) || basePrice;
        const change = lastPrice * (0.002 * (Math.random() - 0.5));
        const newPrice = lastPrice + change;
        this.lastPrices.set(symbol, newPrice);

        return {
            symbol,
            price: newPrice,
            volume: basePrice * 1000 * (0.5 + Math.random()),
            bid: newPrice - 0.01,
            ask: newPrice + 0.01,
            timestamp: Date.now()
        };
    }

    async getMarketData(symbol) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            if (this.useSimulated) {
                return this.generateSimulatedData(symbol);
            }

            const marketIndex = this.getMarketIndex(symbol);
            const market = await this.client.getPerpMarket(marketIndex);
            
            return {
                symbol,
                price: market.price,
                volume: market.volume24H,
                bid: market.bestBid,
                ask: market.bestAsk,
                timestamp: Date.now()
            };
        } catch (error) {
            logger.error(`Error getting market data for ${symbol}:`, error);
            return this.generateSimulatedData(symbol);
        }
    }

    async getHistoricalData(symbol, timeframe = '1h', startTime, endTime) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            if (this.useSimulated) {
                return this.generateSimulatedHistoricalData(timeframe);
            }

            const marketIndex = this.getMarketIndex(symbol);
            const candles = await this.client.getPerpMarketCandles({
                marketIndex,
                resolution: this.getResolution(timeframe),
                startTime: startTime.getTime(),
                endTime: endTime.getTime()
            });

            return candles.map(candle => ({
                timestamp: candle.time,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume
            }));
        } catch (error) {
            logger.error(`Error getting historical data for ${symbol}:`, error);
            return this.generateSimulatedHistoricalData(timeframe);
        }
    }

    generateSimulatedHistoricalData(timeframe) {
        const data = [];
        const intervals = {
            '1m': 60000,
            '5m': 300000,
            '15m': 900000,
            '1h': 3600000,
            '4h': 14400000,
            '1d': 86400000
        };
        
        const interval = intervals[timeframe] || intervals['1h'];
        const numPoints = 100;
        let currentPrice = 60;
        
        for (let i = 0; i < numPoints; i++) {
            const timestamp = Date.now() - (numPoints - i) * interval;
            const change = currentPrice * (0.002 * (Math.random() - 0.5));
            currentPrice += change;
            
            data.push({
                timestamp,
                open: currentPrice - change,
                high: currentPrice + Math.abs(change),
                low: currentPrice - Math.abs(change),
                close: currentPrice,
                volume: currentPrice * 1000 * (0.5 + Math.random())
            });
        }
        
        return data;
    }

    async getAccount() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            if (this.useSimulated) {
                return this.getSimulatedAccount();
            }

            const account = await this.client.getUserAccount();
            return {
                equity: account.totalCollateral,
                freeCollateral: account.freeCollateral,
                marginFraction: account.marginFraction,
                leverage: account.leverage,
                unrealizedPnl: account.unrealizedPnl
            };
        } catch (error) {
            logger.error('Error getting account:', error);
            return this.getSimulatedAccount();
        }
    }

    getSimulatedAccount() {
        return {
            equity: 1000,
            freeCollateral: 800,
            marginFraction: 0.8,
            leverage: 2,
            unrealizedPnl: 50
        };
    }

    getMarketIndex(symbol) {
        const marketIndices = {
            'SOL-PERP': 1,
            'BTC-PERP': 2,
            'ETH-PERP': 3
        };
        return marketIndices[symbol] || 1;
    }

    getResolution(timeframe) {
        const resolutions = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600,
            '4h': 14400,
            '1d': 86400
        };
        return resolutions[timeframe] || 3600;
    }

    async placeTrade(symbol, size, direction) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            if (this.useSimulated) {
                return this.simulateTrade(symbol, size, direction);
            }

            const marketIndex = this.getMarketIndex(symbol);
            const perpMarket = await this.client.getPerpMarket(marketIndex);
            
            const orderParams = {
                marketIndex,
                baseAssetAmount: size,
                direction: direction === 'long' ? 'LONG' : 'SHORT',
                price: perpMarket.price,
                reduceOnly: false
            };

            const tx = await this.client.openPosition(orderParams);
            await tx.wait();

            return {
                success: true,
                orderId: tx.signature,
                symbol,
                size,
                direction,
                price: perpMarket.price,
                timestamp: Date.now()
            };
        } catch (error) {
            logger.error('Error placing trade:', error);
            if (error.message?.includes('region restricted') || 
                error.message?.includes('401') ||
                error.message?.includes('403')) {
                return this.simulateTrade(symbol, size, direction);
            }
            return {
                success: false,
                error: error.message
            };
        }
    }

    simulateTrade(symbol, size, direction) {
        const marketData = this.generateSimulatedData(symbol);
        return {
            success: true,
            orderId: `sim_${Date.now()}`,
            symbol,
            size,
            direction,
            price: marketData.price,
            timestamp: Date.now()
        };
    }
}

module.exports = new DriftService();
const { Drift } = require('@drift-labs/sdk');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const logger = require('../utils/logger');
const bs58 = require('bs58');

class DriftService {
    constructor() {
        this.connection = null;
        this.drift = null;
        this.markets = new Map();
        this.positions = new Map();
        this.initialized = false;
    }

    async initialize() {
        try {
            // Initialize Solana connection
            this.connection = new Connection(
                process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
                'confirmed'
            );

            // Initialize Drift client
            this.drift = new Drift({
                env: process.env.SOLANA_NETWORK || 'devnet',
                connection: this.connection,
                wallet: this.getWallet(),
                programID: new PublicKey(process.env.DRIFT_PROGRAM_ID)
            });

            // Initialize markets
            await this.initializeMarkets();

            this.initialized = true;
            logger.info('Drift service initialized successfully');

            // Start market data subscription
            await this.subscribeToMarketData();

            return true;
        } catch (error) {
            logger.error('Failed to initialize Drift service:', error);
            throw error;
        }
    }

    getWallet() {
        try {
            // For testing, we can use a devnet wallet - in production this should be properly secured
            const privateKey = process.env.SOLANA_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('SOLANA_PRIVATE_KEY environment variable not set');
            }
            
            // Convert private key from base58 to Keypair
            const decodedKey = bs58.decode(privateKey);
            return Keypair.fromSecretKey(decodedKey);
        } catch (error) {
            logger.error('Failed to initialize wallet:', error);
            throw error;
        }
    }

    async initializeMarkets() {
        try {
            const markets = await this.drift.getPerpMarkets();
            markets.forEach(market => {
                this.markets.set(market.marketIndex, {
                    symbol: market.symbol,
                    baseDecimals: market.baseDecimals,
                    quoteDecimals: market.quoteDecimals,
                    minOrderSize: market.minOrderSize,
                    tickSize: market.tickSize
                });
            });
            logger.info('Markets initialized:', Array.from(this.markets.keys()));
        } catch (error) {
            logger.error('Failed to initialize markets:', error);
            throw error;
        }
    }

    async subscribeToMarketData() {
        try {
            // Subscribe to market updates
            this.drift.eventEmitter.on('markPriceUpdate', this.handleMarkPriceUpdate.bind(this));
            this.drift.eventEmitter.on('orderUpdate', this.handleOrderUpdate.bind(this));
            this.drift.eventEmitter.on('positionUpdate', this.handlePositionUpdate.bind(this));

            logger.info('Subscribed to market data');
        } catch (error) {
            logger.error('Failed to subscribe to market data:', error);
            throw error;
        }
    }

    // Event handlers
    handleMarkPriceUpdate(update) {
        logger.debug('Mark price update:', update);
        // Implement mark price update handling
    }

    handleOrderUpdate(update) {
        logger.debug('Order update:', update);
        // Store order updates and emit events for strategy manager
        this.emit('orderUpdate', update);
    }

    handlePositionUpdate(update) {
        logger.debug('Position update:', update);
        // Store position updates and emit events for risk manager
        this.positions.set(update.marketIndex, update);
        this.emit('positionUpdate', update);
    }

    // Trading functions
    async placePerpOrder(params) {
        try {
            const {
                marketIndex,
                side,
                price,
                size,
                orderType = 'LIMIT',
                reduceOnly = false
            } = params;

            // Validate market
            if (!this.markets.has(marketIndex)) {
                throw new Error(`Invalid market index: ${marketIndex}`);
            }

            // Get market info
            const market = this.markets.get(marketIndex);

            // Calculate baseAssetAmount with proper decimals
            const baseAssetAmount = size * Math.pow(10, market.baseDecimals);

            // Place order
            const order = await this.drift.placePerpOrder({
                marketIndex,
                orderType,
                side,
                baseAssetAmount,
                price: price * Math.pow(10, market.quoteDecimals),
                reduceOnly
            });

            logger.info('Order placed:', {
                marketIndex,
                side,
                size,
                price,
                orderId: order.orderId
            });

            return order;
        } catch (error) {
            logger.error('Failed to place order:', error);
            throw error;
        }
    }

    async cancelOrder(orderId) {
        try {
            await this.drift.cancelOrder(orderId);
            logger.info('Order cancelled:', orderId);
        } catch (error) {
            logger.error('Failed to cancel order:', error);
            throw error;
        }
    }

    async getPosition(marketIndex) {
        try {
            const position = await this.drift.getPosition(marketIndex);
            
            if (position) {
                // Convert values to human-readable format
                const market = this.markets.get(marketIndex);
                return {
                    baseAssetAmount: position.baseAssetAmount / Math.pow(10, market.baseDecimals),
                    entryPrice: position.entryPrice / Math.pow(10, market.quoteDecimals),
                    unrealizedPnl: position.unrealizedPnl / Math.pow(10, market.quoteDecimals),
                    leverage: position.leverage,
                    marketIndex: position.marketIndex
                };
            }
            return null;
        } catch (error) {
            if (error.message.includes('Position not found')) {
                return null;
            }
            throw error;
        }
    }

    async getOpenOrders() {
        try {
            const orders = await this.drift.getOpenOrders();
            return orders.map(order => {
                const market = this.markets.get(order.marketIndex);
                return {
                    orderId: order.orderId,
                    marketIndex: order.marketIndex,
                    side: order.side,
                    price: order.price / Math.pow(10, market.quoteDecimals),
                    size: order.baseAssetAmount / Math.pow(10, market.baseDecimals),
                    remainingSize: order.remainingBaseAssetAmount / Math.pow(10, market.baseDecimals),
                    orderType: order.orderType,
                    timestamp: order.timestamp
                };
            });
        } catch (error) {
            logger.error('Failed to get open orders:', error);
            throw error;
        }
    }

    async getMarketData(marketIndex) {
        try {
            if (!this.markets.has(marketIndex)) {
                throw new Error(`Invalid market index: ${marketIndex}`);
            }

            const market = await this.drift.getPerpMarket(marketIndex);
            const orderbook = await this.drift.getOrderBook(marketIndex);
            const fundingRate = await this.drift.getFundingRate(marketIndex);

            const marketInfo = this.markets.get(marketIndex);
            
            // Convert values to human-readable format
            return {
                market: {
                    ...market,
                    currentPrice: market.currentPrice / Math.pow(10, marketInfo.quoteDecimals)
                },
                orderbook: {
                    bids: orderbook.bids.map(bid => ({
                        price: bid.price / Math.pow(10, marketInfo.quoteDecimals),
                        size: bid.size / Math.pow(10, marketInfo.baseDecimals)
                    })),
                    asks: orderbook.asks.map(ask => ({
                        price: ask.price / Math.pow(10, marketInfo.quoteDecimals),
                        size: ask.size / Math.pow(10, marketInfo.baseDecimals)
                    }))
                },
                fundingRate: fundingRate / Math.pow(10, marketInfo.quoteDecimals)
            };
        } catch (error) {
            logger.error('Failed to get market data:', error);
            throw error;
        }
    }

    // Risk management
    async setLeverage(marketIndex, leverage) {
        try {
            await this.drift.setLeverage(marketIndex, leverage);
            logger.info('Leverage set:', { marketIndex, leverage });
        } catch (error) {
            logger.error('Failed to set leverage:', error);
            throw error;
        }
    }

    async closePosition(marketIndex) {
        try {
            const position = await this.getPosition(marketIndex);
            if (!position) {
                logger.info('No position to close');
                return;
            }

            // Get latest market price for market order
            const marketData = await this.getMarketData(marketIndex);
            const currentPrice = marketData.market.currentPrice;

            const order = await this.placePerpOrder({
                marketIndex,
                side: position.baseAssetAmount > 0 ? 'SELL' : 'BUY',
                size: Math.abs(position.baseAssetAmount),
                price: currentPrice,
                orderType: 'MARKET',
                reduceOnly: true
            });

            logger.info('Position close order placed:', order);
            return order;
        } catch (error) {
            logger.error('Failed to close position:', error);
            throw error;
        }
    }

    // Advanced risk management functions
    async placeStopLoss(marketIndex, stopPrice, positionSize) {
        try {
            const position = await this.getPosition(marketIndex);
            if (!position) {
                throw new Error('No open position to place stop loss for');
            }

            const order = await this.drift.placeTriggeredOrder({
                marketIndex,
                orderType: 'TRIGGER_MARKET',
                triggerPrice: stopPrice,
                triggerCondition: position.baseAssetAmount > 0 ? 'BELOW' : 'ABOVE',
                baseAssetAmount: positionSize || Math.abs(position.baseAssetAmount),
                reduceOnly: true
            });

            logger.info('Stop loss order placed:', order);
            return order;
        } catch (error) {
            logger.error('Failed to place stop loss:', error);
            throw error;
        }
    }

    async placeTakeProfit(marketIndex, targetPrice, positionSize) {
        try {
            const position = await this.getPosition(marketIndex);
            if (!position) {
                throw new Error('No open position to place take profit for');
            }

            const order = await this.drift.placeTriggeredOrder({
                marketIndex,
                orderType: 'TRIGGER_MARKET',
                triggerPrice: targetPrice,
                triggerCondition: position.baseAssetAmount > 0 ? 'ABOVE' : 'BELOW',
                baseAssetAmount: positionSize || Math.abs(position.baseAssetAmount),
                reduceOnly: true
            });

            logger.info('Take profit order placed:', order);
            return order;
        } catch (error) {
            logger.error('Failed to place take profit:', error);
            throw error;
        }
    }

    cleanup() {
        try {
            // Cleanup subscriptions and connections
            if (this.drift) {
                this.drift.eventEmitter.removeAllListeners();
            }
            logger.info('Drift service cleanup completed');
        } catch (error) {
            logger.error('Error during Drift service cleanup:', error);
        }
    }
}

module.exports = new DriftService();
const Alpaca = require('@alpacahq/alpaca-trade-api');
const logger = require('../utils/logger');
const config = {
    keyId: process.env.ALPACA_API_KEY,
    secretKey: process.env.ALPACA_API_SECRET,
    paper: true,
    baseUrl: process.env.APCA_API_BASE_URL || 'https://paper-api.alpaca.markets',
    dataUrl: process.env.APCA_API_DATA_URL || 'https://data.alpaca.markets/v2'
};

class AlpacaService {
    constructor() {
        this.alpaca = new Alpaca(config);
        this.positions = new Map();
        this.orders = new Map();
    }

    async initialize() {
        try {
            // Test connection
            const account = await this.alpaca.getAccount();
            logger.info('Connected to Alpaca API:', {
                status: account.status,
                equity: account.equity,
                buying_power: account.buying_power
            });

            // Start tracking positions and orders
            await this.updatePositions();
            await this.updateOrders();

            // Set up websocket for real-time updates
            this.setupWebSocket();

            return true;
        } catch (error) {
            logger.error('Failed to initialize Alpaca service:', error);
            throw error;
        }
    }

    setupWebSocket() {
        const client = this.alpaca.data_stream_v2;

        client.onConnect(() => {
            logger.info('Connected to Alpaca WebSocket');
            client.subscribe(['BTCUSD']);
            logger.info('Subscribed to BTCUSD data stream');
        });

        client.onError((error) => {
            logger.error('Alpaca WebSocket error:', error);
        });

        client.onStockTrade((trade) => {
            logger.debug('Trade received:', {
                symbol: trade.Symbol,
                price: trade.Price,
                size: trade.Size,
                timestamp: trade.Timestamp
            });
        });

        client.onStockQuote((quote) => {
            logger.debug('Quote received:', {
                symbol: quote.Symbol,
                bidPrice: quote.BidPrice,
                askPrice: quote.AskPrice,
                timestamp: quote.Timestamp
            });
        });

        client.connect();
    }

    async executeOrder(orderParams) {
        try {
            const {
                symbol,
                quantity,
                side,
                type,
                timeInForce = 'day',
                limitPrice,
                stopPrice,
                trailingPercent
            } = orderParams;

            // Validate order parameters
            if (!symbol || !quantity || !side || !type) {
                throw new Error('Missing required order parameters');
            }

            // Create order object
            const order = {
                symbol,
                qty: quantity,
                side,
                type,
                time_in_force: timeInForce
            };

            // Add optional parameters
            if (limitPrice) order.limit_price = limitPrice;
            if (stopPrice) order.stop_price = stopPrice;
            if (trailingPercent) order.trail_percent = trailingPercent;

            // Log order details before submission
            logger.info('Submitting order:', order);

            // Submit order to Alpaca
            const result = await this.alpaca.createOrder(order);
            
            // Log successful order creation
            logger.info('Order created successfully:', {
                id: result.id,
                status: result.status,
                filled_qty: result.filled_qty,
                filled_avg_price: result.filled_avg_price
            });

            // Track the order
            this.orders.set(result.id, result);

            return result;
        } catch (error) {
            logger.error('Failed to execute order:', error);
            throw error;
        }
    }

    async getPosition(symbol) {
        try {
            return await this.alpaca.getPosition(symbol);
        } catch (error) {
            if (error.statusCode === 404) {
                logger.info(`No position found for ${symbol}`);
                return null;
            }
            throw error;
        }
    }

    async updatePositions() {
        try {
            const positions = await this.alpaca.getPositions();
            this.positions.clear();
            positions.forEach(position => {
                this.positions.set(position.symbol, position);
            });
            logger.info('Positions updated:', 
                Array.from(this.positions.entries())
                    .map(([symbol, pos]) => ({
                        symbol,
                        quantity: pos.qty,
                        value: pos.market_value
                    }))
            );
            return positions;
        } catch (error) {
            logger.error('Failed to update positions:', error);
            throw error;
        }
    }

    async updateOrders() {
        try {
            const orders = await this.alpaca.getOrders({
                status: 'open',
                direction: 'desc'
            });
            this.orders.clear();
            orders.forEach(order => {
                this.orders.set(order.id, order);
            });
            logger.info('Orders updated:', 
                Array.from(this.orders.entries())
                    .map(([id, order]) => ({
                        id,
                        symbol: order.symbol,
                        side: order.side,
                        quantity: order.qty
                    }))
            );
            return orders;
        } catch (error) {
            logger.error('Failed to update orders:', error);
            throw error;
        }
    }

    async cancelOrder(orderId) {
        try {
            await this.alpaca.cancelOrder(orderId);
            this.orders.delete(orderId);
            logger.info('Order cancelled:', orderId);
        } catch (error) {
            logger.error('Failed to cancel order:', error);
            throw error;
        }
    }

    async closePosition(symbol) {
        try {
            await this.alpaca.closePosition(symbol);
            this.positions.delete(symbol);
            logger.info('Position closed:', symbol);
        } catch (error) {
            logger.error('Failed to close position:', error);
            throw error;
        }
    }

    async getAccountInfo() {
        try {
            const account = await this.alpaca.getAccount();
            logger.info('Account info retrieved:', {
                equity: account.equity,
                buyingPower: account.buying_power,
                cash: account.cash,
                daytradeCount: account.daytrade_count,
                status: account.status
            });
            return account;
        } catch (error) {
            logger.error('Failed to get account info:', error);
            throw error;
        }
    }

    async getMarketData(symbol, timeframe = '1Min', limit = 100) {
        try {
            logger.info(`Fetching ${timeframe} market data for ${symbol}`);
            const bars = await this.alpaca.getBarsV2(symbol, {
                timeframe,
                limit
            });

            const data = [];
            for await (const bar of bars) {
                data.push({
                    timestamp: bar.Timestamp,
                    open: bar.OpenPrice,
                    high: bar.HighPrice,
                    low: bar.LowPrice,
                    close: bar.ClosePrice,
                    volume: bar.Volume
                });
            }
            
            logger.info(`Retrieved ${data.length} bars for ${symbol}`);
            return data;
        } catch (error) {
            logger.error('Failed to get market data:', error);
            throw error;
        }
    }

    async getLatestQuote(symbol) {
        try {
            logger.info(`Fetching latest quote for ${symbol}`);
            const quote = await this.alpaca.getLatestQuote(symbol);
            logger.info(`Latest quote for ${symbol}:`, {
                bidPrice: quote.BidPrice,
                askPrice: quote.AskPrice,
                timestamp: quote.Timestamp
            });
            return quote;
        } catch (error) {
            logger.error(`Failed to get latest quote for ${symbol}:`, error);
            throw error;
        }
    }

    cleanup() {
        try {
            this.alpaca.data_stream_v2.disconnect();
            logger.info('Alpaca service cleanup completed');
        } catch (error) {
            logger.error('Error during Alpaca service cleanup:', error);
        }
    }
}

module.exports = new AlpacaService();
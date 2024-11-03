const axios = require('axios');
const crypto = require('crypto');
const WebSocket = require('ws');
const logger = require('../utils/logger');

class CoinbaseService {
    constructor() {
        // Extract API key ID from the full path
        const apiKeyPath = process.env.COINBASE_API_KEY;
        this.apiKey = apiKeyPath.split('/').pop();
        
        // Clean up private key format
        const privateKey = process.env.COINBASE_API_SECRET
            .replace('-----BEGIN EC PRIVATE KEY-----\\n', '')
            .replace('\\n-----END EC PRIVATE KEY-----\\n', '')
            .replace(/\\n/g, '')
            .trim();
        
        this.apiSecret = privateKey;
        this.baseUrl = 'https://api.coinbase.com/api/v3/brokerage';
        this.wsUrl = 'wss://advanced-trade-ws.coinbase.com';
        
        this.positions = new Map();
        this.orders = new Map();
        this.websocket = null;

        logger.info('Initialized Coinbase service with API key:', this.apiKey);
    }

    async initialize() {
        try {
            // Test connection with a simple request
            const accounts = await this.getAccounts();
            logger.info('Connected to Coinbase Advanced Trade API:', {
                accountCount: accounts.length
            });

            // Start WebSocket connection
            this.setupWebSocket();

            return true;
        } catch (error) {
            logger.error('Failed to initialize Coinbase service:', error);
            throw error;
        }
    }

    generateHeaders(method, path, body = '') {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const message = timestamp + method + path + body;
        
        // Create HMAC signature using EC private key
        const key = crypto.createPrivateKey({
            key: `-----BEGIN EC PRIVATE KEY-----\n${this.apiSecret}\n-----END EC PRIVATE KEY-----`,
            format: 'pem'
        });

        const signature = crypto.sign('sha256', Buffer.from(message), key);
        const signatureHex = signature.toString('hex');

        return {
            'CB-ACCESS-KEY': this.apiKey,
            'CB-ACCESS-SIGN': signatureHex,
            'CB-ACCESS-TIMESTAMP': timestamp,
            'Content-Type': 'application/json'
        };
    }

    async makeRequest(method, endpoint, data = null) {
        try {
            const path = `/api/v3/brokerage${endpoint}`;
            const body = data ? JSON.stringify(data) : '';
            const headers = this.generateHeaders(method, path, body);

            logger.debug('Making API request:', {
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers: {
                    'CB-ACCESS-KEY': headers['CB-ACCESS-KEY'],
                    'CB-ACCESS-TIMESTAMP': headers['CB-ACCESS-TIMESTAMP']
                }
            });

            const response = await axios({
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers,
                data: body || undefined
            });

            return response.data;
        } catch (error) {
            logger.error(`API request failed: ${method} ${endpoint}`, error.response?.data || error);
            throw error;
        }
    }

    setupWebSocket() {
        try {
            this.websocket = new WebSocket(this.wsUrl);

            this.websocket.on('open', () => {
                logger.info('WebSocket connected');
                this.subscribeToChannels();
            });

            this.websocket.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    logger.error('Failed to parse WebSocket message:', error);
                }
            });

            this.websocket.on('error', (error) => {
                logger.error('WebSocket error:', error);
            });

            this.websocket.on('close', () => {
                logger.warn('WebSocket disconnected, attempting to reconnect...');
                setTimeout(() => this.setupWebSocket(), 5000);
            });
        } catch (error) {
            logger.error('Failed to setup WebSocket:', error);
            throw error;
        }
    }

    subscribeToChannels() {
        // Create signature for WebSocket authentication
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const key = crypto.createPrivateKey({
            key: `-----BEGIN EC PRIVATE KEY-----\n${this.apiSecret}\n-----END EC PRIVATE KEY-----`,
            format: 'pem'
        });
        const signature = crypto.sign('sha256', Buffer.from(timestamp), key);

        const subscribeMessage = {
            type: 'subscribe',
            product_ids: ['BTC-USD', 'ETH-USD'],
            channel: 'market_data',
            api_key: this.apiKey,
            timestamp,
            signature: signature.toString('hex')
        };

        this.websocket.send(JSON.stringify(subscribeMessage));
        logger.info('Subscribed to WebSocket channels:', {
            products: subscribeMessage.product_ids,
            channel: subscribeMessage.channel
        });
    }

    handleWebSocketMessage(message) {
        switch (message.channel) {
            case 'market_data':
                logger.debug('Market data update:', message);
                break;
            case 'user':
                logger.debug('User update:', message);
                break;
            default:
                logger.debug('Unknown message type:', message);
        }
    }

    // Account Management
    async getAccounts() {
        return await this.makeRequest('GET', '/accounts');
    }

    // Market Data
    async getProduct(productId) {
        return await this.makeRequest('GET', `/products/${productId}`);
    }

    async getProductBook(productId, level = 1) {
        return await this.makeRequest('GET', `/products/${productId}/book?level=${level}`);
    }

    async getProductTicker(productId) {
        return await this.makeRequest('GET', `/products/${productId}/ticker`);
    }

    // Order Management
    async createOrder(orderParams) {
        const {
            product_id,
            side,
            order_configuration
        } = orderParams;

        const order = {
            product_id,
            side,
            order_configuration
        };

        return await this.makeRequest('POST', '/orders', order);
    }

    async createMarketOrder(productId, side, size) {
        const order = {
            product_id: productId,
            side,
            order_configuration: {
                market_market_ioc: {
                    quote_size: size
                }
            }
        };

        return await this.createOrder(order);
    }

    async createLimitOrder(productId, side, size, price) {
        const order = {
            product_id: productId,
            side,
            order_configuration: {
                limit_limit_gtc: {
                    base_size: size,
                    limit_price: price
                }
            }
        };

        return await this.createOrder(order);
    }

    async getOrder(orderId) {
        return await this.makeRequest('GET', `/orders/${orderId}`);
    }

    async cancelOrder(orderId) {
        return await this.makeRequest('DELETE', `/orders/${orderId}`);
    }

    async getOpenOrders() {
        return await this.makeRequest('GET', '/orders');
    }

    // Positions
    async getPositions() {
        return await this.makeRequest('GET', '/positions');
    }

    async closePosition(productId) {
        const position = await this.getPosition(productId);
        if (!position) {
            throw new Error(`No position found for ${productId}`);
        }

        // Create a market order in the opposite direction to close the position
        const side = position.side === 'LONG' ? 'SELL' : 'BUY';
        return await this.createMarketOrder(productId, side, Math.abs(position.size));
    }

    // Helper Methods
    async getPosition(productId) {
        const positions = await this.getPositions();
        return positions.find(p => p.product_id === productId);
    }

    cleanup() {
        try {
            if (this.websocket) {
                this.websocket.close();
            }
            logger.info('Coinbase service cleanup completed');
        } catch (error) {
            logger.error('Error during Coinbase service cleanup:', error);
        }
    }
}

module.exports = new CoinbaseService();
const logger = require('../utils/logger');
const Portfolio = require('../models/Portfolio');
const { withTransaction } = require('./database');
const { ALPACA_API_KEY, ALPACA_API_SECRET } = process.env;

class MarketService {
    constructor() {
        // Initialize Alpaca API client
        this.alpaca = new (require('@alpacahq/alpaca-trade-api'))({
            keyId: ALPACA_API_KEY,
            secretKey: ALPACA_API_SECRET,
            paper: true // Use paper trading
        });

        this.marketDataSubscribers = new Map();
        this.priceUpdateInterval = null;
    }

    async initialize() {
        try {
            // Start WebSocket connection for real-time data
            const client = this.alpaca.data_stream_v2;

            client.onConnect(() => {
                logger.info('Connected to Alpaca WebSocket');
                this.subscribeToDefaultSymbols();
            });

            client.onStockTrade((trade) => {
                this.handleTrade(trade);
            });

            client.onStockQuote((quote) => {
                this.handleQuote(quote);
            });

            client.onError((error) => {
                logger.error('Alpaca WebSocket error:', error);
            });

            client.onDisconnect(() => {
                logger.warn('Disconnected from Alpaca WebSocket');
            });

            await client.connect();

            // Start price update interval
            this.startPriceUpdateInterval();

        } catch (error) {
            logger.error('Failed to initialize market service:', error);
            throw error;
        }
    }

    async subscribeToDefaultSymbols() {
        const defaultSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
        await this.alpaca.data_stream_v2.subscribe(defaultSymbols);
        logger.info(`Subscribed to symbols: ${defaultSymbols.join(', ')}`);
    }

    handleTrade(trade) {
        const subscribers = this.marketDataSubscribers.get(trade.symbol) || [];
        subscribers.forEach(callback => {
            try {
                callback({
                    type: 'trade',
                    symbol: trade.symbol,
                    price: trade.price,
                    size: trade.size,
                    timestamp: trade.timestamp
                });
            } catch (error) {
                logger.error(`Error in trade subscriber callback for ${trade.symbol}:`, error);
            }
        });
    }

    handleQuote(quote) {
        const subscribers = this.marketDataSubscribers.get(quote.symbol) || [];
        subscribers.forEach(callback => {
            try {
                callback({
                    type: 'quote',
                    symbol: quote.symbol,
                    bidPrice: quote.bidPrice,
                    bidSize: quote.bidSize,
                    askPrice: quote.askPrice,
                    askSize: quote.askSize,
                    timestamp: quote.timestamp
                });
            } catch (error) {
                logger.error(`Error in quote subscriber callback for ${quote.symbol}:`, error);
            }
        });
    }

    startPriceUpdateInterval() {
        // Update prices every minute
        this.priceUpdateInterval = setInterval(async () => {
            try {
                await this.updateAllPrices();
            } catch (error) {
                logger.error('Error updating prices:', error);
            }
        }, 60000);
    }

    async updateAllPrices() {
        return await withTransaction(async (session) => {
            try {
                // Get all unique symbols from portfolios
                const portfolios = await Portfolio.find({}, null, { session });
                const symbols = new Set();
                
                portfolios.forEach(portfolio => {
                    portfolio.positions.forEach(position => {
                        symbols.add(position.symbol);
                    });
                });

                // Get latest prices
                const prices = await this.getCurrentPrices(Array.from(symbols));

                // Update portfolio positions
                for (const portfolio of portfolios) {
                    let updated = false;
                    
                    portfolio.positions.forEach(position => {
                        const price = prices[position.symbol];
                        if (price) {
                            position.currentPrice = price;
                            position.marketValue = position.quantity * price;
                            updated = true;
                        }
                    });

                    if (updated) {
                        portfolio.totalEquity = portfolio.calculateTotalValue();
                        await portfolio.save({ session });
                    }
                }

            } catch (error) {
                logger.error('Failed to update prices:', error);
                throw error;
            }
        });
    }

    async getCurrentPrices(symbols) {
        try {
            const prices = {};
            
            for (const symbol of symbols) {
                try {
                    const trades = await this.alpaca.getLatestTrade(symbol);
                    prices[symbol] = trades.price;
                } catch (error) {
                    logger.error(`Failed to get price for ${symbol}:`, error);
                }
            }

            return prices;
        } catch (error) {
            logger.error('Failed to fetch current prices:', error);
            throw error;
        }
    }

    subscribeToMarketData(symbol, callback) {
        if (!this.marketDataSubscribers.has(symbol)) {
            this.marketDataSubscribers.set(symbol, []);
            // Subscribe to the symbol if not already subscribed
            this.alpaca.data_stream_v2.subscribe([symbol]);
        }
        
        this.marketDataSubscribers.get(symbol).push(callback);
        logger.info(`Subscribed to market data for ${symbol}`);
    }

    unsubscribeFromMarketData(symbol, callback) {
        const subscribers = this.marketDataSubscribers.get(symbol);
        if (subscribers) {
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
                logger.info(`Unsubscribed from market data for ${symbol}`);
            }
            
            if (subscribers.length === 0) {
                this.marketDataSubscribers.delete(symbol);
                // Unsubscribe from the symbol if no more subscribers
                this.alpaca.data_stream_v2.unsubscribe([symbol]);
            }
        }
    }

    async getHistoricalData(symbol, timeframe, startDate, endDate) {
        try {
            const bars = await this.alpaca.getBarsV2(
                symbol,
                {
                    start: startDate,
                    end: endDate,
                    timeframe: timeframe || '1Min'
                }
            );

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

            return data;
        } catch (error) {
            logger.error(`Failed to get historical data for ${symbol}:`, error);
            throw error;
        }
    }

    cleanup() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        
        try {
            this.alpaca.data_stream_v2.disconnect();
        } catch (error) {
            logger.error('Error during market service cleanup:', error);
        }
    }
}

module.exports = new MarketService();
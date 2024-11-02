const Binance = require('node-binance-api');
const logger = require('../utils/logger');

class BinanceClient {
    constructor() {
        this.client = new Binance().options({
            APIKEY: process.env.BINANCE_API_KEY,
            APISECRET: process.env.BINANCE_API_SECRET,
            useServerTime: true,
            test: true // Use testnet
        });
    }

    async connect() {
        try {
            await this.client.useServerTime();
            logger.info('Connected to Binance API successfully');
        } catch (error) {
            logger.error('Failed to connect to Binance:', error);
            throw error;
        }
    }

    async getMarketData(symbol, interval = '1h', limit = 100) {
        try {
            const candles = await this.client.candlesticks(symbol, interval, limit);
            return this.formatMarketData(candles);
        } catch (error) {
            logger.error(`Failed to get market data for ${symbol}:`, error);
            throw error;
        }
    }

    formatMarketData(candles) {
        return {
            prices: candles.map(candle => parseFloat(candle[4])), // Close prices
            volumes: candles.map(candle => parseFloat(candle[5])),
            timestamps: candles.map(candle => candle[0]),
            price: parseFloat(candles[candles.length - 1][4]) // Latest price
        };
    }

    async placeOrder(order) {
        try {
            const { symbol, side, quantity, price } = order;
            
            const orderResult = await this.client.order({
                symbol,
                side,
                quantity,
                price,
                type: 'LIMIT',
                timeInForce: 'GTC'
            });

            logger.info(`Order placed successfully:`, orderResult);
            return orderResult;
        } catch (error) {
            logger.error('Failed to place order:', error);
            throw error;
        }
    }

    async getAccountBalance() {
        try {
            const balances = await this.client.balance();
            return Object.entries(balances).map(([asset, data]) => ({
                asset,
                free: parseFloat(data.available),
                locked: parseFloat(data.onOrder)
            })).filter(balance => balance.free > 0 || balance.locked > 0);
        } catch (error) {
            logger.error('Failed to get account balance:', error);
            throw error;
        }
    }

    async getSymbolInfo(symbol) {
        try {
            const exchangeInfo = await this.client.exchangeInfo();
            const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === symbol);
            
            if (!symbolInfo) {
                throw new Error(`Symbol ${symbol} not found`);
            }
            
            return {
                symbol: symbolInfo.symbol,
                status: symbolInfo.status,
                baseAsset: symbolInfo.baseAsset,
                quoteAsset: symbolInfo.quoteAsset,
                filters: symbolInfo.filters
            };
        } catch (error) {
            logger.error(`Failed to get symbol info for ${symbol}:`, error);
            throw error;
        }
    }

    async subscribeToMarket(symbol, callback) {
        try {
            await this.client.websockets.candlesticks(symbol, '1m', (candlestick) => {
                const {
                    e: eventType,
                    E: eventTime,
                    s: symbol,
                    k: ticks
                } = candlestick;

                const {
                    o: open,
                    h: high,
                    l: low,
                    c: close,
                    v: volume,
                    n: trades,
                    i: interval,
                    x: isFinal,
                    q: quoteVolume,
                    V: buyVolume,
                    Q: quoteBuyVolume
                } = ticks;

                callback({
                    eventType,
                    eventTime,
                    symbol,
                    interval,
                    open: parseFloat(open),
                    high: parseFloat(high),
                    low: parseFloat(low),
                    close: parseFloat(close),
                    volume: parseFloat(volume),
                    trades,
                    isFinal,
                    quoteVolume: parseFloat(quoteVolume),
                    buyVolume: parseFloat(buyVolume),
                    quoteBuyVolume: parseFloat(quoteBuyVolume)
                });
            });

            logger.info(`Subscribed to market data for ${symbol}`);
        } catch (error) {
            logger.error(`Failed to subscribe to market data for ${symbol}:`, error);
            throw error;
        }
    }
}

module.exports = BinanceClient;
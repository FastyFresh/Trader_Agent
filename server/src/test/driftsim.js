const logger = require('../utils/logger');

// Simulated Drift Protocol data for testing
const markets = {
    'SOL-PERP': {
        currentPrice: 60.0,
        volume: 1000000,
        baseDecimals: 9,
        quoteDecimals: 6
    },
    'WBTC-PERP': {
        currentPrice: 35000.0,
        volume: 500000,
        baseDecimals: 8,
        quoteDecimals: 6
    }
};

const positions = new Map();
const orders = new Map();

function generatePriceData(market, timeframes = 100) {
    const data = [];
    let currentPrice = markets[market].currentPrice;
    
    for (let i = 0; i < timeframes; i++) {
        const change = currentPrice * (0.002 * (Math.random() - 0.5));
        currentPrice += change;
        const volume = markets[market].volume * (0.5 + Math.random());
        
        data.push({
            timestamp: Date.now() - (i * 60 * 60 * 1000),
            price: currentPrice,
            volume: volume,
            high: currentPrice + Math.abs(change),
            low: currentPrice - Math.abs(change),
            open: currentPrice - change,
            close: currentPrice
        });
    }
    
    return data.reverse();
}

function simulateAccount() {
    return {
        equity: 100,
        marginFraction: 0.1,
        totalPositionValue: 0,
        totalCollateral: 100,
        unrealizedPnl: 0
    };
}

const driftSim = {
    getMarketData: async (market) => {
        if (!markets[market]) throw new Error(`Market ${market} not found`);
        const priceData = generatePriceData(market, 1)[0];
        
        return {
            market: {
                marketIndex: market,
                currentPrice: priceData.price,
                volume: priceData.volume,
                ...markets[market]
            }
        };
    },
    
    getHistoricalData: async (market, timeframe, startTime, endTime) => {
        if (!markets[market]) throw new Error(`Market ${market} not found`);
        return generatePriceData(market);
    },
    
    getAccount: async () => simulateAccount(),
    
    getOpenPositions: async () => Array.from(positions.values()),
    
    getPosition: async (market) => positions.get(market),
    
    placePerpOrder: async (order) => {
        logger.info('Simulated order placed:', order);
        const orderId = `ord_${Date.now()}`;
        orders.set(orderId, order);
        
        // Simulate position creation for market orders
        if (order.orderType === 'MARKET') {
            positions.set(order.marketIndex, {
                marketIndex: order.marketIndex,
                size: order.size,
                entryPrice: order.price,
                unrealizedPnl: 0,
                leverage: 1
            });
        }
        
        return {
            orderId,
            ...order
        };
    },
    
    placeStopLoss: async (market, price, size) => {
        logger.info('Stop loss placed:', { market, price, size });
        return {
            orderId: `sl_${Date.now()}`,
            market,
            price,
            size,
            type: 'STOP_LOSS'
        };
    },
    
    placeTakeProfit: async (market, price, size) => {
        logger.info('Take profit placed:', { market, price, size });
        return {
            orderId: `tp_${Date.now()}`,
            market,
            price,
            size,
            type: 'TAKE_PROFIT'
        };
    },
    
    drift: {
        eventEmitter: {
            on: (event, callback) => {
                setInterval(() => {
                    const market = Object.keys(markets)[Math.floor(Math.random() * Object.keys(markets).length)];
                    const data = generatePriceData(market, 1)[0];
                    
                    switch (event) {
                        case 'markPriceUpdate':
                            callback({
                                marketIndex: market,
                                price: data.price,
                                volume: data.volume
                            });
                            break;
                        case 'positionUpdate':
                            const position = positions.get(market);
                            if (position) {
                                callback({
                                    ...position,
                                    marketIndex: market,
                                    unrealizedPnl: (data.price - position.entryPrice) * position.size
                                });
                            }
                            break;
                    }
                }, 5000);
            },
            removeAllListeners: () => {}
        }
    }
};

module.exports = driftSim;
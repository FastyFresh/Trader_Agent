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

function generatePriceData(market, timeframes = 100) {
    const data = [];
    let currentPrice = markets[market].currentPrice;
    
    for (let i = 0; i < timeframes; i++) {
        // Simulate price movement with random walk
        const change = currentPrice * (0.002 * (Math.random() - 0.5));
        currentPrice += change;
        
        // Simulate volume with random fluctuation around base volume
        const volume = markets[market].volume * (0.5 + Math.random());
        
        data.push({
            timestamp: Date.now() - (i * 60 * 60 * 1000), // Hourly data
            price: currentPrice,
            volume: volume,
            high: currentPrice + Math.abs(change),
            low: currentPrice - Math.abs(change),
            open: currentPrice - change,
            close: currentPrice
        });
    }
    
    return data.reverse(); // Most recent last
}

function simulateAccount() {
    return {
        equity: 100, // Starting with $100
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
    
    getOpenPositions: async () => [],
    
    placePerpOrder: async (order) => {
        logger.info('Simulated order placed:', order);
        return {
            orderId: `ord_${Date.now()}`,
            ...order
        };
    },
    
    drift: {
        eventEmitter: {
            on: (event, callback) => {
                // Simulate events
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
                            callback({
                                marketIndex: market,
                                size: 0,
                                entryPrice: data.price,
                                unrealizedPnl: 0
                            });
                            break;
                    }
                }, 5000); // Every 5 seconds
            },
            removeAllListeners: () => {}
        }
    }
};

module.exports = driftSim;
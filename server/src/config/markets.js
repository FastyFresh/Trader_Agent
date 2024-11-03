const markets = {
    'SOL-PERP': {
        name: 'SOL-PERP',
        baseToken: 'SOL',
        quoteToken: 'USDC',
        minOrderSize: 0.1,
        tickSize: 0.01,
        minLeverage: 1,
        maxLeverage: 10,
        defaultLeverage: 3,
        currentPrice: 160, // Current SOL price in USD
        requiredBalance: 0.8 // ~$125 worth of SOL at current price
    },
    'WBTC-PERP': {
        name: 'WBTC-PERP',
        baseToken: 'WBTC',
        quoteToken: 'USDC',
        minOrderSize: 0.001,
        tickSize: 1.0,
        priceDecimalPlaces: 1,
        sizeDecimalPlaces: 3,
        minLeverage: 1,
        maxLeverage: 10,
        defaultLeverage: 3
    }
};

module.exports = markets;
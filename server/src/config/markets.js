const markets = {
    'SOL-PERP': {
        name: 'SOL-PERP',
        baseToken: 'SOL',
        quoteToken: 'USDC',
        minOrderSize: 0.1,
        tickSize: 0.01,
        minLeverage: 1,
        maxLeverage: 10,
        defaultLeverage: 3
    },
    'WBTC-PERP': {
        name: 'WBTC-PERP',
        baseToken: 'WBTC',
        quoteToken: 'USDC',
        minOrderSize: 0.001,
        tickSize: 1,
        minLeverage: 1,
        maxLeverage: 10,
        defaultLeverage: 3
    }
};

module.exports = markets;
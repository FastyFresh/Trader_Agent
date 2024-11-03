module.exports = {
    // Initial Phase ($100-$1,000)
    initialPhase: {
        capital: {
            min: 100,
            max: 1000
        },
        grid: {
            enabled: false
        },
        momentum: {
            enabled: true,
            timeframe: '15m',
            threshold: 0.015,
            volumeMultiplier: 1.5,
            leverage: 5,
            positionSize: 0.95 // 95% of capital per trade
        },
        riskManagement: {
            stopLoss: 0.02,
            takeProfit: 0.04,
            maxDrawdown: 0.15
        }
    },

    // Growth Phase ($1,000-$10,000)
    growthPhase: {
        capital: {
            min: 1000,
            max: 10000
        },
        grid: {
            enabled: true,
            levels: 15,
            spacing: 0.02,
            leverage: 4,
            allocation: 0.5 // 50% of capital
        },
        momentum: {
            enabled: true,
            timeframe: '15m',
            threshold: 0.02,
            volumeMultiplier: 1.5,
            leverage: 4,
            allocation: 0.5
        },
        riskManagement: {
            stopLoss: 0.015,
            takeProfit: 0.03,
            maxDrawdown: 0.12
        }
    },

    // Scaling Phase ($10,000+)
    scalingPhase: {
        capital: {
            min: 10000,
            max: 1000000
        },
        grid: {
            enabled: true,
            levels: 20,
            spacing: 0.015,
            leverage: 3,
            allocation: 0.6 // 60% of capital
        },
        momentum: {
            enabled: true,
            timeframe: '1h',
            threshold: 0.025,
            volumeMultiplier: 1.8,
            leverage: 3,
            allocation: 0.4
        },
        riskManagement: {
            stopLoss: 0.01,
            takeProfit: 0.02,
            maxDrawdown: 0.1
        }
    },

    // Market-specific configurations
    markets: {
        'SOL-PERP': {
            minOrderSize: 0.1,
            tickSize: 0.01,
            priceDecimalPlaces: 2,
            sizeDecimalPlaces: 1
        },
        'WBTC-PERP': {
            minOrderSize: 0.001,
            tickSize: 1.0,
            priceDecimalPlaces: 1,
            sizeDecimalPlaces: 3
        }
    },

    // Common parameters
    common: {
        compounding: true,
        rebalanceThreshold: 0.1, // 10% deviation triggers rebalancing
        minTradeInterval: 5 * 60 * 1000, // 5 minutes
        maxConcurrentTrades: 3,
        emergencyStopLoss: 0.25 // 25% portfolio drawdown stops trading
    }
};
module.exports = {
    trendFollowing: {
        name: 'TrendFollowing',
        description: 'Follows market trends using moving averages and momentum indicators',
        timeframe: '4h',
        parameters: {
            // Moving Averages
            shortMA: 9,
            longMA: 21,
            
            // RSI Settings
            rsiPeriod: 14,
            rsiOverbought: 70,
            rsiOversold: 30,
            
            // Position Sizing
            maxPositionSize: 0.1, // 10% of portfolio
            initialRisk: 0.02,    // 2% risk per trade
            
            // Trade Management
            stopLoss: 0.02,       // 2% stop loss
            takeProfit: 0.04,     // 4% take profit
            trailingStop: true,
            trailingStopDistance: 0.015 // 1.5% trailing stop
        },
        tradingPairs: ['BTC/USD', 'ETH/USD'],
        enabled: true
    },

    meanReversion: {
        name: 'MeanReversion',
        description: 'Mean reversion strategy using Bollinger Bands and RSI',
        timeframe: '1h',
        parameters: {
            // Bollinger Bands
            bollingerPeriod: 20,
            bollingerStdDev: 2,
            
            // RSI
            rsiPeriod: 14,
            rsiOverbought: 70,
            rsiOversold: 30,
            
            // Position Sizing
            maxPositionSize: 0.08, // 8% of portfolio
            initialRisk: 0.015,    // 1.5% risk per trade
            
            // Trade Management
            stopLoss: 0.015,      // 1.5% stop loss
            takeProfit: 0.03,     // 3% take profit
            trailingStop: false
        },
        tradingPairs: ['BTC/USD', 'ETH/USD'],
        enabled: true
    },

    // Grid Trading Strategy
    gridTrading: {
        name: 'GridTrading',
        description: 'Grid trading with dynamic grid spacing based on volatility',
        timeframe: '1h',
        parameters: {
            // Grid Configuration
            gridLevels: 10,
            gridSpacing: 0.01,    // 1% between grid levels
            dynamicSpacing: true, // Adjust grid spacing based on volatility
            
            // Position Sizing
            maxPositionSize: 0.05, // 5% of portfolio per grid level
            totalAllocation: 0.3,  // 30% total portfolio allocation
            
            // Risk Management
            stopLoss: 0.05,       // 5% global stop loss
            takeProfit: 0.02,     // 2% profit per grid level
            
            // Volatility Settings
            volatilityPeriod: 20,
            volatilityMultiplier: 1.5
        },
        tradingPairs: ['BTC/USD'],
        enabled: false // Not enabled by default
    },

    volumeProfile: {
        name: 'VolumeProfile',
        description: 'Trading based on volume profile and price action',
        timeframe: '1h',
        parameters: {
            // Volume Profile
            profilePeriod: 24,    // Hours to analyze
            valueAreaVolume: 0.7,  // 70% of volume
            
            // VWAP Settings
            vwapDeviations: [1, 2],
            
            // Position Sizing
            maxPositionSize: 0.07, // 7% of portfolio
            initialRisk: 0.018,    // 1.8% risk per trade
            
            // Trade Management
            stopLoss: 0.018,      // 1.8% stop loss
            takeProfit: 0.036,    // 3.6% take profit
            trailingStop: true,
            trailingStopDistance: 0.012 // 1.2% trailing stop
        },
        tradingPairs: ['BTC/USD', 'ETH/USD'],
        enabled: false // Not enabled by default
    }
};
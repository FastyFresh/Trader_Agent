module.exports = {
    goal: {
        initialCapital: 100,
        targetEquity: 1000000,
        maxTimeHorizon: 5 * 365, // 5 years in days
        milestones: [
            { amount: 1000, description: 'Initial growth target' },
            { amount: 10000, description: 'Early scaling milestone' },
            { amount: 50000, description: 'Mid-term milestone' },
            { amount: 250000, description: 'Major scaling point' },
            { amount: 1000000, description: 'Final goal' }
        ]
    },

    performance: {
        required: {
            minDailyReturn: 0.0138, // Calculated for $100 to $1M in 5 years
            minMonthlyReturn: 0.42,
            minYearlyReturn: 5.0,
            maxDrawdown: 0.20,
            minWinRate: 0.60,
            minSharpeRatio: 1.5
        },
        optimal: {
            targetDailyReturn: 0.02,
            targetMonthlyReturn: 0.6,
            targetYearlyReturn: 7.2,
            maxDrawdown: 0.15,
            targetWinRate: 0.65,
            targetSharpeRatio: 2.0
        }
    },

    riskManagement: {
        portfolioHeatRules: [
            {
                equity: { min: 100, max: 1000 },
                maxHeat: 1.0, // 100% portfolio heat allowed
                maxLeverage: 5
            },
            {
                equity: { min: 1000, max: 10000 },
                maxHeat: 0.8, // 80% portfolio heat allowed
                maxLeverage: 4
            },
            {
                equity: { min: 10000, max: 50000 },
                maxHeat: 0.7, // 70% portfolio heat allowed
                maxLeverage: 3
            },
            {
                equity: { min: 50000, max: 1000000 },
                maxHeat: 0.6, // 60% portfolio heat allowed
                maxLeverage: 2.5
            }
        ],
        
        positionSizing: {
            initialPhase: {
                maxPositionSize: 0.95, // 95% of capital
                riskPerTrade: 0.02    // 2% risk per trade
            },
            growthPhase: {
                maxPositionSize: 0.5,  // 50% of capital
                riskPerTrade: 0.015   // 1.5% risk per trade
            },
            scalingPhase: {
                maxPositionSize: 0.3,  // 30% of capital
                riskPerTrade: 0.01    // 1% risk per trade
            }
        }
    },

    monitoring: {
        rebalanceThresholds: {
            strategyDeviation: 0.1,   // 10% strategy allocation deviation
            portfolioDrawdown: 0.15,  // 15% portfolio drawdown
            profitTaking: 0.25       // 25% profit taking threshold
        },
        
        performanceMetrics: {
            evaluationPeriod: '1d',
            compoundingFrequency: '1d',
            profitLockIn: 0.5  // Lock in 50% of profits at each milestone
        },
        
        alertThresholds: {
            drawdown: 0.1,        // Alert at 10% drawdown
            profitTarget: 0.2,    // Alert at 20% profit
            riskExposure: 0.8     // Alert at 80% risk capacity
        }
    }
};
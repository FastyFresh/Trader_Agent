module.exports = {
    portfolio: {
        totalEquity: 750.25,
        cashBalance: 250.75,
        todayReturn: 5.25,
        totalReturn: 50.05,
        riskMetrics: {
            maxDrawdown: 8.5,
            sharpeRatio: 1.8,
            volatility: 12.5,
            valueAtRisk: 15.0,
            exposure: {
                total: 65.5,
                byAsset: {
                    'BTC/USD': 30.5,
                    'ETH/USD': 20.0,
                    'SOL/USD': 15.0
                }
            }
        }
    },

    activeTrades: [
        {
            id: '1',
            symbol: 'BTC/USD',
            type: 'BUY',
            quantity: 0.01,
            entryPrice: 35000,
            currentPrice: 36500,
            pnl: 15.0,
            pnlPercent: 4.28,
            strategy: 'Trend Following',
            timestamp: new Date().toISOString()
        },
        {
            id: '2',
            symbol: 'ETH/USD',
            type: 'SELL',
            quantity: 0.5,
            entryPrice: 2200,
            currentPrice: 2150,
            pnl: 25.0,
            pnlPercent: 2.27,
            strategy: 'Mean Reversion',
            timestamp: new Date().toISOString()
        }
    ],

    strategies: [
        {
            id: '1',
            name: 'Trend Following',
            status: 'active',
            performance: {
                winRate: 65.5,
                pnl: 125.50
            },
            risk: {
                drawdown: 7.5,
                sharpe: 1.95
            }
        },
        {
            id: '2',
            name: 'Mean Reversion',
            status: 'active',
            performance: {
                winRate: 58.2,
                pnl: 85.25
            },
            risk: {
                drawdown: 5.8,
                sharpe: 1.65
            }
        }
    ],

    performanceData: {
        dates: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split('T')[0];
        }),
        equity: Array.from({ length: 30 }, (_, i) => {
            const baseValue = 500;
            const trend = i * 10;
            const noise = Math.random() * 20 - 10;
            return baseValue + trend + noise;
        }),
        returns: Array.from({ length: 30 }, () => {
            return (Math.random() * 4) - 1;
        })
    }
};
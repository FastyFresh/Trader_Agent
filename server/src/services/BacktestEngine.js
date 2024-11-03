const logger = require('../utils/logger');
const driftService = require('./drift');
const GridTradingStrategy = require('./strategy/GridTradingStrategy');
const MomentumStrategy = require('./strategy/MomentumStrategy');

class BacktestEngine {
    constructor(config = {}) {
        this.config = {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            endDate: new Date(),
            initialCapital: 100,
            markets: ['SOL-PERP'],
            timeframe: '1h',
            slippage: 0.001, // 0.1% slippage
            tradingFee: 0.0005, // 0.05% trading fee
            ...config
        };

        this.results = new Map();
        this.historicalData = new Map();
    }

    async initialize() {
        try {
            // Load historical data for all markets
            for (const market of this.config.markets) {
                const marketData = await this.loadHistoricalData(market);
                this.historicalData.set(market, marketData);
            }

            logger.info('Backtest Engine initialized');
        } catch (error) {
            logger.error('Failed to initialize backtest engine:', error);
            throw error;
        }
    }

    async loadHistoricalData(market) {
        try {
            // Get historical data from Drift Protocol
            const data = await driftService.getHistoricalData(
                market,
                this.config.timeframe,
                this.config.startDate,
                this.config.endDate
            );

            return data.map(candle => ({
                timestamp: candle.timestamp,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume
            }));

        } catch (error) {
            logger.error(`Error loading historical data for ${market}:`, error);
            throw error;
        }
    }

    async runBacktest(strategy) {
        try {
            const results = {
                trades: [],
                equity: [this.config.initialCapital],
                metrics: {
                    totalTrades: 0,
                    winningTrades: 0,
                    losingTrades: 0,
                    totalPnL: 0,
                    maxDrawdown: 0,
                    sharpeRatio: 0,
                    sortino: 0,
                    winRate: 0
                }
            };

            let capital = this.config.initialCapital;
            let peak = capital;

            // Run backtest for each market
            for (const [market, data] of this.historicalData.entries()) {
                let position = null;

                // Initialize strategy instance
                const strategyInstance = this.createStrategy(strategy, {
                    symbol: market,
                    initialCapital: capital
                });

                // Simulate trading
                for (let i = 100; i < data.length; i++) { // Start at 100 to have enough historical data
                    const historicalData = data.slice(0, i);
                    const currentCandle = data[i];
                    const signals = await this.generateSignals(strategyInstance, historicalData);

                    // Process signals
                    for (const signal of signals) {
                        const trade = await this.executeBacktestTrade(signal, currentCandle, position);
                        
                        if (trade) {
                            position = trade.position;
                            capital = trade.capital;
                            results.trades.push(trade);

                            // Update peak equity and drawdown
                            if (capital > peak) peak = capital;
                            const drawdown = (peak - capital) / peak;
                            if (drawdown > results.metrics.maxDrawdown) {
                                results.metrics.maxDrawdown = drawdown;
                            }

                            results.equity.push(capital);
                        }
                    }
                }
            }

            // Calculate final metrics
            this.calculateMetrics(results);
            this.results.set(strategy.constructor.name, results);

            return results;

        } catch (error) {
            logger.error('Error running backtest:', error);
            throw error;
        }
    }

    createStrategy(strategy, config) {
        switch (strategy.toLowerCase()) {
            case 'grid':
                return new GridTradingStrategy(config);
            case 'momentum':
                return new MomentumStrategy(config);
            default:
                throw new Error(`Unknown strategy: ${strategy}`);
        }
    }

    async generateSignals(strategy, historicalData) {
        if (strategy instanceof GridTradingStrategy) {
            return strategy.checkGridLevels(historicalData[historicalData.length - 1].close);
        } else if (strategy instanceof MomentumStrategy) {
            return strategy.analyzeMarket(historicalData);
        }
        return [];
    }

    async executeBacktestTrade(signal, candle, currentPosition) {
        try {
            const executionPrice = this.calculateExecutionPrice(signal, candle);
            
            if (!executionPrice) return null;

            const trade = {
                timestamp: candle.timestamp,
                market: signal.market,
                side: signal.side,
                size: signal.size,
                price: executionPrice,
                fee: executionPrice * signal.size * this.config.tradingFee
            };

            // Calculate PnL if closing position
            if (currentPosition && signal.reduceOnly) {
                trade.pnl = this.calculatePnL(currentPosition, trade);
                trade.capital = currentPosition.capital + trade.pnl - trade.fee;
                trade.position = null;
            } else {
                trade.pnl = 0;
                trade.capital = currentPosition ? currentPosition.capital : this.config.initialCapital;
                trade.position = {
                    side: signal.side,
                    size: signal.size,
                    entryPrice: executionPrice,
                    capital: trade.capital
                };
            }

            return trade;

        } catch (error) {
            logger.error('Error executing backtest trade:', error);
            return null;
        }
    }

    calculateExecutionPrice(signal, candle) {
        const slippage = signal.side === 'LONG' ? 1 + this.config.slippage : 1 - this.config.slippage;
        const basePrice = signal.price || candle.close;
        
        // Check if the order would have been filled
        if (signal.side === 'LONG') {
            return basePrice * slippage <= candle.high ? basePrice * slippage : null;
        } else {
            return basePrice * slippage >= candle.low ? basePrice * slippage : null;
        }
    }

    calculatePnL(position, closingTrade) {
        const multiplier = position.side === 'LONG' ? 1 : -1;
        return multiplier * position.size * (closingTrade.price - position.entryPrice);
    }

    calculateMetrics(results) {
        // Trading metrics
        results.metrics.totalTrades = results.trades.length;
        results.metrics.winningTrades = results.trades.filter(t => t.pnl > 0).length;
        results.metrics.losingTrades = results.trades.filter(t => t.pnl < 0).length;
        results.metrics.totalPnL = results.trades.reduce((sum, t) => sum + t.pnl, 0);
        
        // Win rate
        results.metrics.winRate = results.metrics.totalTrades > 0
            ? (results.metrics.winningTrades / results.metrics.totalTrades) * 100
            : 0;

        // Calculate returns
        const returns = [];
        for (let i = 1; i < results.equity.length; i++) {
            returns.push((results.equity[i] - results.equity[i-1]) / results.equity[i-1]);
        }

        // Sharpe Ratio
        const riskFreeRate = 0.02 / 365; // Assuming 2% annual risk-free rate
        const excessReturns = returns.map(r => r - riskFreeRate);
        const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
        const stdDev = this.calculateStandardDeviation(excessReturns);
        results.metrics.sharpeRatio = stdDev === 0 ? 0 : (avgExcessReturn / stdDev) * Math.sqrt(365);

        // Sortino Ratio
        const negativeReturns = returns.filter(r => r < 0);
        const downside = this.calculateStandardDeviation(negativeReturns);
        results.metrics.sortino = downside === 0 ? 0 : (avgExcessReturn / downside) * Math.sqrt(365);
    }

    calculateStandardDeviation(values) {
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
        return Math.sqrt(variance);
    }

    getBacktestReport(strategyName) {
        const results = this.results.get(strategyName);
        if (!results) return null;

        const initialCapital = this.config.initialCapital;
        const finalCapital = results.equity[results.equity.length - 1];
        const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;

        return {
            strategy: strategyName,
            period: {
                start: this.config.startDate,
                end: this.config.endDate
            },
            performance: {
                initialCapital,
                finalCapital,
                totalReturn,
                ...results.metrics
            },
            trades: results.trades,
            equity: results.equity
        };
    }
}

module.exports = new BacktestEngine();
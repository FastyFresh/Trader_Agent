const logger = require('../utils/logger');
const driftService = require('./drift');
const performanceTracker = require('./PerformanceTracker');
const riskManagement = require('./RiskManagementService');

class PortfolioManager {
    constructor(config = {}) {
        this.config = {
            rebalanceThreshold: 0.05, // 5% deviation triggers rebalancing
            maxStrategies: 3, // Maximum number of concurrent strategies
            strategyAllocation: {
                grid: 0.4,    // 40% allocation
                momentum: 0.4, // 40% allocation
                reserve: 0.2   // 20% reserve
            },
            minStrategyPerformance: 0.02, // 2% minimum monthly return
            evaluationPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
            ...config
        };

        this.activeStrategies = new Map();
        this.strategyPerformance = new Map();
        this.lastRebalance = Date.now();
    }

    async initialize() {
        try {
            // Get account information
            const account = await driftService.getAccount();
            this.portfolioValue = account.equity;

            // Initialize strategy allocations
            await this.initializeStrategies();

            // Start monitoring
            this.startMonitoring();

            logger.info('Portfolio Manager initialized');
        } catch (error) {
            logger.error('Failed to initialize portfolio manager:', error);
            throw error;
        }
    }

    async initializeStrategies() {
        try {
            const availableCapital = this.portfolioValue * (1 - this.config.strategyAllocation.reserve);
            
            // Initialize Grid Trading Strategy
            const gridAllocation = availableCapital * this.config.strategyAllocation.grid;
            const gridStrategy = new (require('./strategy/GridTradingStrategy'))({
                totalInvestment: gridAllocation
            });
            await gridStrategy.initialize();
            this.activeStrategies.set('grid', gridStrategy);

            // Initialize Momentum Strategy
            const momentumAllocation = availableCapital * this.config.strategyAllocation.momentum;
            const momentumStrategy = new (require('./strategy/MomentumStrategy'))({
                totalInvestment: momentumAllocation
            });
            await momentumStrategy.initialize();
            this.activeStrategies.set('momentum', momentumStrategy);

            logger.info('Strategies initialized with allocations:', {
                grid: gridAllocation,
                momentum: momentumAllocation,
                reserve: this.portfolioValue * this.config.strategyAllocation.reserve
            });

        } catch (error) {
            logger.error('Error initializing strategies:', error);
            throw error;
        }
    }

    startMonitoring() {
        // Monitor strategy performance
        setInterval(() => this.evaluateStrategies(), 6 * 60 * 60 * 1000); // Every 6 hours

        // Monitor portfolio balance
        setInterval(() => this.checkRebalancing(), 60 * 60 * 1000); // Every hour

        // Track performance metrics
        driftService.drift.eventEmitter.on('accountUpdate', async (update) => {
            await this.updatePortfolioMetrics(update);
        });
    }

    async evaluateStrategies() {
        try {
            const currentTime = Date.now();
            const evaluationStartTime = currentTime - this.config.evaluationPeriod;

            for (const [name, strategy] of this.activeStrategies.entries()) {
                // Get strategy performance
                const performance = await this.getStrategyPerformance(name, evaluationStartTime);
                this.strategyPerformance.set(name, performance);

                // Check if strategy meets minimum performance criteria
                if (performance.monthlyReturn < this.config.minStrategyPerformance) {
                    await this.adjustStrategy(name, strategy, performance);
                }
            }

            logger.info('Strategy evaluation completed');

        } catch (error) {
            logger.error('Error evaluating strategies:', error);
        }
    }

    async getStrategyPerformance(strategyName, startTime) {
        const trades = performanceTracker.trades.filter(
            trade => trade.strategy === strategyName && trade.timestamp >= startTime
        );

        const initialValue = trades[0]?.price || 0;
        const currentValue = trades[trades.length - 1]?.price || 0;
        const monthlyReturn = (currentValue - initialValue) / initialValue;

        return {
            trades: trades.length,
            monthlyReturn,
            winRate: trades.filter(t => t.pnl > 0).length / trades.length,
            averagePnL: trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length
        };
    }

    async adjustStrategy(name, strategy, performance) {
        try {
            logger.info(`Adjusting strategy ${name} due to underperformance:`, performance);

            if (name === 'grid') {
                // Adjust grid levels and spacing
                const newConfig = {
                    ...strategy.config,
                    gridLevels: Math.max(5, strategy.config.gridLevels - 2),
                    gridSpacing: strategy.config.gridSpacing * 1.2
                };
                await strategy.stop();
                await strategy.initialize(newConfig);
                await strategy.start();

            } else if (name === 'momentum') {
                // Adjust momentum parameters
                const newConfig = {
                    ...strategy.config,
                    momentumThreshold: strategy.config.momentumThreshold * 1.1,
                    volumeThreshold: strategy.config.volumeThreshold * 1.1
                };
                await strategy.stop();
                await strategy.initialize(newConfig);
                await strategy.start();
            }

            logger.info(`Strategy ${name} adjusted with new configuration`);

        } catch (error) {
            logger.error(`Error adjusting strategy ${name}:`, error);
        }
    }

    async checkRebalancing() {
        try {
            const currentTime = Date.now();
            if (currentTime - this.lastRebalance < 24 * 60 * 60 * 1000) return; // Only rebalance daily

            const account = await driftService.getAccount();
            const currentAllocations = await this.getCurrentAllocations();

            let needsRebalancing = false;
            
            // Check if any allocation deviates more than threshold
            for (const [strategy, allocation] of Object.entries(this.config.strategyAllocation)) {
                if (strategy === 'reserve') continue;
                
                const currentAllocation = currentAllocations[strategy];
                const deviation = Math.abs(currentAllocation - allocation);
                
                if (deviation > this.config.rebalanceThreshold) {
                    needsRebalancing = true;
                    break;
                }
            }

            if (needsRebalancing) {
                await this.rebalancePortfolio(account.equity, currentAllocations);
                this.lastRebalance = currentTime;
            }

        } catch (error) {
            logger.error('Error checking rebalancing:', error);
        }
    }

    async getCurrentAllocations() {
        try {
            const allocations = {};
            const totalValue = await this.getPortfolioValue();

            for (const [name, strategy] of this.activeStrategies.entries()) {
                const strategyValue = await this.getStrategyValue(strategy);
                allocations[name] = strategyValue / totalValue;
            }

            return allocations;

        } catch (error) {
            logger.error('Error getting current allocations:', error);
            throw error;
        }
    }

    async rebalancePortfolio(totalEquity, currentAllocations) {
        try {
            logger.info('Starting portfolio rebalance');

            for (const [name, strategy] of this.activeStrategies.entries()) {
                const targetAllocation = this.config.strategyAllocation[name];
                const currentAllocation = currentAllocations[name];
                
                if (Math.abs(currentAllocation - targetAllocation) > this.config.rebalanceThreshold) {
                    const targetValue = totalEquity * targetAllocation;
                    const currentValue = totalEquity * currentAllocation;
                    const difference = targetValue - currentValue;

                    if (difference > 0) {
                        // Need to increase allocation
                        await this.increaseStrategyAllocation(strategy, difference);
                    } else {
                        // Need to decrease allocation
                        await this.decreaseStrategyAllocation(strategy, Math.abs(difference));
                    }
                }
            }

            logger.info('Portfolio rebalance completed');

        } catch (error) {
            logger.error('Error rebalancing portfolio:', error);
        }
    }

    async increaseStrategyAllocation(strategy, amount) {
        try {
            const positions = await driftService.getOpenPositions();
            const availableMarkets = positions.filter(p => p.baseAssetAmount === 0);

            if (availableMarkets.length > 0) {
                const market = availableMarkets[0];
                await strategy.adjustPosition(market.marketIndex, amount);
            }

        } catch (error) {
            logger.error('Error increasing strategy allocation:', error);
        }
    }

    async decreaseStrategyAllocation(strategy, amount) {
        try {
            const positions = await strategy.getPositions();
            
            for (const position of positions) {
                const reduction = Math.min(position.baseAssetAmount, amount);
                await strategy.reducePosition(position.marketIndex, reduction);
                
                amount -= reduction;
                if (amount <= 0) break;
            }

        } catch (error) {
            logger.error('Error decreasing strategy allocation:', error);
        }
    }

    async updatePortfolioMetrics(update) {
        try {
            this.portfolioValue = update.equity;

            // Update risk metrics
            await riskManagement.updateRiskMetrics({
                equity: update.equity,
                positions: await driftService.getOpenPositions(),
                strategies: Array.from(this.activeStrategies.entries()).map(([name, strategy]) => ({
                    name,
                    allocation: this.config.strategyAllocation[name],
                    performance: this.strategyPerformance.get(name)
                }))
            });

        } catch (error) {
            logger.error('Error updating portfolio metrics:', error);
        }
    }

    async getPortfolioValue() {
        const account = await driftService.getAccount();
        return account.equity;
    }

    async getStrategyValue(strategy) {
        const positions = await strategy.getPositions();
        return positions.reduce((sum, pos) => sum + pos.notional, 0);
    }

    getStatus() {
        return {
            portfolioValue: this.portfolioValue,
            strategies: Object.fromEntries(
                Array.from(this.activeStrategies.entries()).map(([name, strategy]) => [
                    name,
                    {
                        allocation: this.config.strategyAllocation[name],
                        performance: this.strategyPerformance.get(name)
                    }
                ])
            ),
            lastRebalance: this.lastRebalance,
            reserveAllocation: this.config.strategyAllocation.reserve
        };
    }
}

module.exports = new PortfolioManager();
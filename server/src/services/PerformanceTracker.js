const logger = require('../utils/logger');
const driftService = require('./drift');

class PerformanceTracker {
    constructor(config = {}) {
        this.config = {
            targetEquity: 1000000, // $1M target
            initialInvestment: 100, // $100 starting capital
            checkpointIntervals: [1000, 10000, 100000, 500000], // Milestone checkpoints
            timeHorizon: {
                min: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years in ms
                max: 5 * 365 * 24 * 60 * 60 * 1000  // 5 years in ms
            },
            ...config
        };

        this.performance = {
            startDate: Date.now(),
            currentEquity: this.config.initialInvestment,
            peakEquity: this.config.initialInvestment,
            totalPnL: 0,
            trades: 0,
            winRate: 0,
            averageReturn: 0,
            sharpeRatio: 0,
            drawdown: 0,
            maxDrawdown: 0,
            nextMilestone: this.config.checkpointIntervals[0]
        };

        this.trades = [];
        this.dailyReturns = [];
    }

    async initialize() {
        try {
            // Get current account status
            const account = await driftService.getAccount();
            this.performance.currentEquity = account.equity;
            this.performance.peakEquity = account.equity;

            // Start tracking
            this.startTracking();

            logger.info('Performance Tracker initialized');
        } catch (error) {
            logger.error('Failed to initialize performance tracker:', error);
            throw error;
        }
    }

    startTracking() {
        // Track trades
        driftService.drift.eventEmitter.on('orderUpdate', async (update) => {
            if (update.status === 'FILLED') {
                await this.recordTrade(update);
            }
        });

        // Track equity changes
        driftService.drift.eventEmitter.on('accountUpdate', async (update) => {
            await this.updatePerformance(update);
        });

        // Daily performance calculation
        setInterval(() => this.calculateDailyPerformance(), 24 * 60 * 60 * 1000);
    }

    async recordTrade(trade) {
        try {
            const pnl = trade.realizedPnl || 0;
            
            this.trades.push({
                timestamp: Date.now(),
                market: trade.marketIndex,
                side: trade.side,
                size: trade.size,
                price: trade.price,
                pnl: pnl,
                fees: trade.fee
            });

            // Update performance metrics
            this.performance.trades++;
            this.performance.totalPnL += pnl;

            const winningTrades = this.trades.filter(t => t.pnl > 0).length;
            this.performance.winRate = (winningTrades / this.performance.trades) * 100;

            await this.checkMilestones();

        } catch (error) {
            logger.error('Error recording trade:', error);
        }
    }

    async updatePerformance(update) {
        try {
            const currentEquity = update.equity;
            this.performance.currentEquity = currentEquity;

            // Update peak equity
            if (currentEquity > this.performance.peakEquity) {
                this.performance.peakEquity = currentEquity;
            }

            // Calculate drawdown
            const drawdown = (this.performance.peakEquity - currentEquity) / this.performance.peakEquity;
            this.performance.drawdown = drawdown;

            if (drawdown > this.performance.maxDrawdown) {
                this.performance.maxDrawdown = drawdown;
            }

            // Check progress towards goal
            await this.checkMilestones();

        } catch (error) {
            logger.error('Error updating performance:', error);
        }
    }

    async calculateDailyPerformance() {
        try {
            const previousEquity = this.dailyReturns.length > 0 
                ? this.dailyReturns[this.dailyReturns.length - 1].equity 
                : this.config.initialInvestment;

            const dailyReturn = (this.performance.currentEquity - previousEquity) / previousEquity;
            
            this.dailyReturns.push({
                timestamp: Date.now(),
                equity: this.performance.currentEquity,
                return: dailyReturn
            });

            // Calculate average return
            const totalReturn = this.dailyReturns.reduce((sum, day) => sum + day.return, 0);
            this.performance.averageReturn = totalReturn / this.dailyReturns.length;

            // Calculate Sharpe Ratio
            const riskFreeRate = 0.02 / 365; // Assuming 2% annual risk-free rate
            const returns = this.dailyReturns.map(day => day.return);
            const excessReturns = returns.map(r => r - riskFreeRate);
            const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
            const stdDev = this.calculateStandardDeviation(excessReturns);
            this.performance.sharpeRatio = stdDev === 0 ? 0 : (avgExcessReturn / stdDev) * Math.sqrt(365);

        } catch (error) {
            logger.error('Error calculating daily performance:', error);
        }
    }

    calculateStandardDeviation(values) {
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
        return Math.sqrt(variance);
    }

    async checkMilestones() {
        try {
            const currentEquity = this.performance.currentEquity;
            
            // Check if we've reached the next milestone
            if (currentEquity >= this.performance.nextMilestone) {
                const milestone = this.performance.nextMilestone;
                const timeElapsed = Date.now() - this.performance.startDate;
                
                logger.info(`Milestone reached: $${milestone}`, {
                    timeElapsed: timeElapsed,
                    totalTrades: this.performance.trades,
                    winRate: this.performance.winRate,
                    sharpeRatio: this.performance.sharpeRatio
                });

                // Update next milestone
                const milestoneIndex = this.config.checkpointIntervals.indexOf(milestone);
                if (milestoneIndex < this.config.checkpointIntervals.length - 1) {
                    this.performance.nextMilestone = this.config.checkpointIntervals[milestoneIndex + 1];
                }

                // Calculate required growth rate for remaining milestones
                await this.updateRequiredGrowthRate();
            }

        } catch (error) {
            logger.error('Error checking milestones:', error);
        }
    }

    async updateRequiredGrowthRate() {
        try {
            const timeElapsed = Date.now() - this.performance.startDate;
            const timeRemaining = this.config.timeHorizon.max - timeElapsed;
            
            if (timeRemaining <= 0) return;

            const remainingGrowth = this.config.targetEquity / this.performance.currentEquity;
            const daysRemaining = timeRemaining / (24 * 60 * 60 * 1000);
            
            // Calculate required daily return
            const requiredDailyReturn = Math.pow(remainingGrowth, 1/daysRemaining) - 1;
            
            logger.info('Updated required growth rate:', {
                requiredDailyReturn: requiredDailyReturn,
                daysRemaining: daysRemaining,
                currentEquity: this.performance.currentEquity
            });

        } catch (error) {
            logger.error('Error updating required growth rate:', error);
        }
    }

    getPerformanceReport() {
        const timeElapsed = Date.now() - this.performance.startDate;
        const progressPercentage = (this.performance.currentEquity / this.config.targetEquity) * 100;
        
        return {
            currentEquity: this.performance.currentEquity,
            totalPnL: this.performance.totalPnL,
            progressToGoal: progressPercentage,
            timeElapsed: timeElapsed,
            metrics: {
                trades: this.performance.trades,
                winRate: this.performance.winRate,
                averageReturn: this.performance.averageReturn,
                sharpeRatio: this.performance.sharpeRatio,
                maxDrawdown: this.performance.maxDrawdown,
                currentDrawdown: this.performance.drawdown
            },
            nextMilestone: this.performance.nextMilestone,
            recentTrades: this.trades.slice(-10)
        };
    }
}

module.exports = new PerformanceTracker();
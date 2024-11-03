const logger = require('../utils/logger');
const driftService = require('./drift');
const strategyFactory = require('./strategy/StrategyFactory');
const strategyConfig = require('../config/strategies');
const targets = require('../config/targets');
const performanceTracker = require('./PerformanceTracker');

class AutoTrader {
    constructor() {
        this.activeStrategies = new Map();
        this.walletSubscriptions = new Map();
        this.status = {
            isRunning: false,
            currentPhase: null,
            activeMarkets: [],
            currentBalance: 0,
            lastUpdate: null
        };
    }

    async initialize(walletPublicKey) {
        try {
            // Initialize Drift connection
            await driftService.initialize();

            // Subscribe to wallet
            await this.subscribeToWallet(walletPublicKey);

            // Initialize performance tracking
            await this.initializeTracking();

            logger.info('AutoTrader initialized for wallet:', walletPublicKey);
            return true;
        } catch (error) {
            logger.error('Failed to initialize AutoTrader:', error);
            throw error;
        }
    }

    async subscribeToWallet(walletPublicKey) {
        try {
            // Get initial balance
            const account = await driftService.getAccount();
            this.status.currentBalance = account.equity;

            // Subscribe to account updates
            driftService.drift.eventEmitter.on('accountUpdate', this.handleAccountUpdate.bind(this));

            // Store subscription
            this.walletSubscriptions.set(walletPublicKey, true);

            logger.info('Subscribed to wallet updates:', walletPublicKey);
        } catch (error) {
            logger.error('Error subscribing to wallet:', error);
            throw error;
        }
    }

    async initializeTracking() {
        try {
            const config = {
                initialCapital: this.status.currentBalance,
                targetEquity: targets.goal.targetEquity,
                timeHorizon: targets.goal.maxTimeHorizon
            };

            await performanceTracker.initialize(config);
            logger.info('Performance tracking initialized');
        } catch (error) {
            logger.error('Error initializing performance tracking:', error);
            throw error;
        }
    }

    async start() {
        try {
            if (this.status.isRunning) {
                logger.warn('AutoTrader is already running');
                return;
            }

            // Determine current phase
            const phase = this.determinePhase();
            this.status.currentPhase = phase;

            // Initialize strategies for current phase
            await this.initializePhaseStrategies(phase);

            this.status.isRunning = true;
            this.status.lastUpdate = Date.now();

            logger.info('AutoTrader started in phase:', phase);
            return true;
        } catch (error) {
            logger.error('Error starting AutoTrader:', error);
            throw error;
        }
    }

    determinePhase() {
        const balance = this.status.currentBalance;
        
        if (balance <= strategyConfig.initialPhase.capital.max) {
            return 'initialPhase';
        } else if (balance <= strategyConfig.growthPhase.capital.max) {
            return 'growthPhase';
        } else {
            return 'scalingPhase';
        }
    }

    async initializePhaseStrategies(phase) {
        const config = strategyConfig[phase];
        const markets = Object.keys(strategyConfig.markets);
        
        // Clear existing strategies
        await this.stopAllStrategies();
        
        for (const market of markets) {
            if (config.momentum.enabled) {
                await this.initializeMomentumStrategy(market, config.momentum);
            }
            
            if (config.grid.enabled) {
                await this.initializeGridStrategy(market, config.grid);
            }
        }

        this.status.activeMarkets = markets;
    }

    async initializeMomentumStrategy(market, config) {
        try {
            const strategy = await strategyFactory.createStrategy('momentum', {
                market,
                ...config
            });

            this.activeStrategies.set(`momentum_${market}`, strategy);
            logger.info('Momentum strategy initialized for:', market);
        } catch (error) {
            logger.error('Error initializing momentum strategy:', error);
            throw error;
        }
    }

    async initializeGridStrategy(market, config) {
        try {
            const strategy = await strategyFactory.createStrategy('grid', {
                market,
                ...config
            });

            this.activeStrategies.set(`grid_${market}`, strategy);
            logger.info('Grid strategy initialized for:', market);
        } catch (error) {
            logger.error('Error initializing grid strategy:', error);
            throw error;
        }
    }

    async handleAccountUpdate(update) {
        try {
            // Update balance
            this.status.currentBalance = update.equity;

            // Check if phase change is needed
            const currentPhase = this.determinePhase();
            if (currentPhase !== this.status.currentPhase) {
                await this.handlePhaseTransition(currentPhase);
            }

            // Update performance tracking
            await performanceTracker.updatePerformance(update);

            // Check emergency conditions
            await this.checkEmergencyConditions(update);

            this.status.lastUpdate = Date.now();
        } catch (error) {
            logger.error('Error handling account update:', error);
        }
    }

    async handlePhaseTransition(newPhase) {
        try {
            logger.info('Transitioning from', this.status.currentPhase, 'to', newPhase);

            // Initialize new phase strategies
            await this.initializePhaseStrategies(newPhase);

            // Update status
            this.status.currentPhase = newPhase;

            logger.info('Phase transition completed');
        } catch (error) {
            logger.error('Error during phase transition:', error);
        }
    }

    async checkEmergencyConditions(update) {
        try {
            const performance = performanceTracker.getPerformanceReport();
            
            // Check emergency stop loss
            if (performance.drawdown > strategyConfig.common.emergencyStopLoss) {
                await this.emergencyStop('Emergency stop loss triggered');
                return;
            }

            // Check minimum balance
            if (update.equity < targets.goal.initialCapital * 0.75) {
                await this.emergencyStop('Balance below 75% of initial capital');
                return;
            }
        } catch (error) {
            logger.error('Error checking emergency conditions:', error);
        }
    }

    async emergencyStop(reason) {
        try {
            logger.warn('Emergency stop triggered:', reason);

            // Close all positions
            await this.closeAllPositions();

            // Stop all strategies
            await this.stopAllStrategies();

            // Update status
            this.status.isRunning = false;
            this.status.lastUpdate = Date.now();

            logger.info('Emergency stop completed');
        } catch (error) {
            logger.error('Error during emergency stop:', error);
        }
    }

    async closeAllPositions() {
        try {
            const positions = await driftService.getOpenPositions();
            
            for (const position of positions) {
                await driftService.closePosition(position.marketIndex);
            }

            logger.info('All positions closed');
        } catch (error) {
            logger.error('Error closing positions:', error);
        }
    }

    async stopAllStrategies() {
        try {
            for (const [id, strategy] of this.activeStrategies.entries()) {
                await strategy.stop();
                this.activeStrategies.delete(id);
            }

            logger.info('All strategies stopped');
        } catch (error) {
            logger.error('Error stopping strategies:', error);
        }
    }

    async stop() {
        try {
            await this.closeAllPositions();
            await this.stopAllStrategies();

            // Clear subscriptions
            this.walletSubscriptions.clear();

            // Update status
            this.status.isRunning = false;
            this.status.lastUpdate = Date.now();

            logger.info('AutoTrader stopped');
            return true;
        } catch (error) {
            logger.error('Error stopping AutoTrader:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            ...this.status,
            performance: performanceTracker.getPerformanceReport(),
            activeStrategies: Array.from(this.activeStrategies.keys())
        };
    }
}

module.exports = new AutoTrader();
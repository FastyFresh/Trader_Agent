const logger = require('../utils/logger');
const driftService = require('./drift');
const strategyFactory = require('./strategy/StrategyFactory');
const strategyConfig = require('../config/strategies');
const targets = require('../config/targets');
const performanceTracker = require('./PerformanceTracker');
const { validateConfig } = require('../utils/validation');
const { RateLimiter } = require('../utils/rateLimiter');

class AutoTrader {
    constructor() {
        this.activeStrategies = new Map();
        this.walletSubscriptions = new Map();
        this.eventListeners = new Set();
        this.rateLimiter = new RateLimiter(10, 1000); // 10 requests per second
        this.status = {
            isRunning: false,
            currentPhase: null,
            activeMarkets: [],
            currentBalance: 0,
            lastUpdate: null,
            errors: []
        };
    }

    async initialize(walletPublicKey) {
        try {
            if (!walletPublicKey) {
                throw new Error('Wallet public key is required');
            }

            // Initialize Drift connection with retry logic
            let retries = 3;
            while (retries > 0) {
                try {
                    await driftService.initialize();
                    break;
                } catch (error) {
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Subscribe to wallet with validation
            await this.subscribeToWallet(walletPublicKey);

            // Initialize performance tracking with validation
            await this.initializeTracking();

            logger.info('AutoTrader initialized for wallet:', walletPublicKey);
            return true;
        } catch (error) {
            this.handleError('initialization', error);
            throw error;
        }
    }

    async subscribeToWallet(walletPublicKey) {
        try {
            if (this.walletSubscriptions.has(walletPublicKey)) {
                logger.warn('Already subscribed to wallet:', walletPublicKey);
                return;
            }

            // Get initial balance with timeout
            const account = await this.executeWithTimeout(
                driftService.getAccount(),
                5000,
                'Account fetch timeout'
            );
            this.status.currentBalance = account.equity;

            // Subscribe to account updates with cleanup
            const handleUpdate = this.handleAccountUpdate.bind(this);
            driftService.drift.eventEmitter.on('accountUpdate', handleUpdate);
            this.eventListeners.add(['accountUpdate', handleUpdate]);

            this.walletSubscriptions.set(walletPublicKey, true);
            logger.info('Subscribed to wallet updates:', walletPublicKey);
        } catch (error) {
            this.handleError('wallet subscription', error);
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

            if (!validateConfig(config)) {
                throw new Error('Invalid tracking configuration');
            }

            await performanceTracker.initialize(config);
            logger.info('Performance tracking initialized');
        } catch (error) {
            this.handleError('tracking initialization', error);
            throw error;
        }
    }

    async start() {
        try {
            if (this.status.isRunning) {
                logger.warn('AutoTrader is already running');
                return;
            }

            // Check prerequisites
            if (!this.status.currentBalance) {
                throw new Error('Account balance not initialized');
            }

            // Determine and validate current phase
            const phase = this.determinePhase();
            if (!strategyConfig[phase]) {
                throw new Error(`Invalid phase: ${phase}`);
            }

            this.status.currentPhase = phase;

            // Initialize strategies with rate limiting
            await this.rateLimiter.execute(() => 
                this.initializePhaseStrategies(phase)
            );

            this.status.isRunning = true;
            this.status.lastUpdate = Date.now();
            this.status.errors = [];

            logger.info('AutoTrader started in phase:', phase);
            return true;
        } catch (error) {
            this.handleError('startup', error);
            throw error;
        }
    }

    determinePhase() {
        const balance = this.status.currentBalance;
        
        if (balance <= 0) {
            throw new Error('Invalid balance');
        }
        
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
        if (!config) {
            throw new Error(`Invalid phase configuration: ${phase}`);
        }

        const markets = Object.keys(strategyConfig.markets);
        if (!markets.length) {
            throw new Error('No markets configured');
        }
        
        // Clear existing strategies safely
        await this.stopAllStrategies();
        
        for (const market of markets) {
            try {
                if (config.momentum.enabled) {
                    await this.rateLimiter.execute(() =>
                        this.initializeMomentumStrategy(market, config.momentum)
                    );
                }
                
                if (config.grid.enabled) {
                    await this.rateLimiter.execute(() =>
                        this.initializeGridStrategy(market, config.grid)
                    );
                }
            } catch (error) {
                logger.error(`Failed to initialize strategies for ${market}:`, error);
                // Continue with other markets
            }
        }

        this.status.activeMarkets = markets;
    }

    async initializeMomentumStrategy(market, config) {
        try {
            if (!market || !config) {
                throw new Error('Invalid momentum strategy parameters');
            }

            const strategy = await strategyFactory.createStrategy('momentum', {
                market,
                ...config
            });

            this.activeStrategies.set(`momentum_${market}`, strategy);
            logger.info('Momentum strategy initialized for:', market);
        } catch (error) {
            this.handleError(`momentum strategy initialization for ${market}`, error);
            throw error;
        }
    }

    async initializeGridStrategy(market, config) {
        try {
            if (!market || !config) {
                throw new Error('Invalid grid strategy parameters');
            }

            const strategy = await strategyFactory.createStrategy('grid', {
                market,
                ...config
            });

            this.activeStrategies.set(`grid_${market}`, strategy);
            logger.info('Grid strategy initialized for:', market);
        } catch (error) {
            this.handleError(`grid strategy initialization for ${market}`, error);
            throw error;
        }
    }

    async handleAccountUpdate(update) {
        try {
            if (!update || typeof update.equity !== 'number') {
                throw new Error('Invalid account update');
            }

            // Update balance with validation
            if (update.equity >= 0) {
                this.status.currentBalance = update.equity;
            }

            // Check phase transition
            const currentPhase = this.determinePhase();
            if (currentPhase !== this.status.currentPhase) {
                await this.handlePhaseTransition(currentPhase);
            }

            // Update performance tracking
            await performanceTracker.updatePerformance(update);

            // Check risk conditions
            await this.checkEmergencyConditions(update);

            this.status.lastUpdate = Date.now();
        } catch (error) {
            this.handleError('account update', error);
        }
    }

    async handlePhaseTransition(newPhase) {
        try {
            logger.info('Transitioning from', this.status.currentPhase, 'to', newPhase);

            // Initialize new phase strategies with rate limiting
            await this.rateLimiter.execute(() =>
                this.initializePhaseStrategies(newPhase)
            );

            this.status.currentPhase = newPhase;
            logger.info('Phase transition completed');
        } catch (error) {
            this.handleError('phase transition', error);
        }
    }

    async checkEmergencyConditions(update) {
        try {
            const performance = performanceTracker.getPerformanceReport();
            
            if (!performance) {
                throw new Error('Unable to get performance report');
            }
            
            // Check emergency conditions with thresholds
            if (performance.drawdown > strategyConfig.common.emergencyStopLoss) {
                await this.emergencyStop('Emergency stop loss triggered');
                return;
            }

            if (update.equity < targets.goal.initialCapital * 0.75) {
                await this.emergencyStop('Balance below 75% of initial capital');
                return;
            }

            // Additional risk checks
            if (performance.sharpeRatio < -2) {
                await this.emergencyStop('Critical risk metrics detected');
                return;
            }
        } catch (error) {
            this.handleError('emergency condition check', error);
        }
    }

    async emergencyStop(reason) {
        try {
            logger.warn('Emergency stop triggered:', reason);

            // Close all positions with retry
            await this.executeWithRetry(
                () => this.closeAllPositions(),
                3,
                1000
            );

            // Stop all strategies
            await this.stopAllStrategies();

            // Update status
            this.status.isRunning = false;
            this.status.lastUpdate = Date.now();
            this.status.errors.push({
                time: Date.now(),
                type: 'emergency_stop',
                reason
            });

            logger.info('Emergency stop completed');
        } catch (error) {
            this.handleError('emergency stop', error);
        }
    }

    async closeAllPositions() {
        try {
            const positions = await driftService.getOpenPositions();
            
            if (!Array.isArray(positions)) {
                throw new Error('Invalid positions data');
            }
            
            const closePromises = positions.map(position =>
                this.rateLimiter.execute(() =>
                    driftService.closePosition(position.marketIndex)
                )
            );

            await Promise.all(closePromises);
            logger.info('All positions closed');
        } catch (error) {
            this.handleError('position closing', error);
            throw error;
        }
    }

    async stopAllStrategies() {
        try {
            const stopPromises = Array.from(this.activeStrategies.values()).map(
                strategy => strategy.stop().catch(error => {
                    logger.error('Error stopping strategy:', error);
                })
            );

            await Promise.all(stopPromises);
            this.activeStrategies.clear();
            logger.info('All strategies stopped');
        } catch (error) {
            this.handleError('strategy stopping', error);
            throw error;
        }
    }

    async stop() {
        try {
            // Close positions and stop strategies
            await Promise.all([
                this.closeAllPositions(),
                this.stopAllStrategies()
            ]);

            // Clean up event listeners
            this.eventListeners.forEach(([event, handler]) => {
                driftService.drift.eventEmitter.removeListener(event, handler);
            });
            this.eventListeners.clear();

            // Clear subscriptions
            this.walletSubscriptions.clear();

            // Update status
            this.status.isRunning = false;
            this.status.lastUpdate = Date.now();

            logger.info('AutoTrader stopped');
            return true;
        } catch (error) {
            this.handleError('shutdown', error);
            throw error;
        }
    }

    getStatus() {
        return {
            ...this.status,
            performance: performanceTracker.getPerformanceReport(),
            activeStrategies: Array.from(this.activeStrategies.keys()),
            rateLimiterStatus: this.rateLimiter.getStatus()
        };
    }

    // Utility methods
    async executeWithTimeout(promise, timeout, errorMessage) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(errorMessage)), timeout)
            )
        ]);
    }

    async executeWithRetry(fn, maxRetries, delay) {
        let retries = maxRetries;
        while (retries > 0) {
            try {
                return await fn();
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    handleError(context, error) {
        logger.error(`Error in ${context}:`, error);
        this.status.errors.push({
            time: Date.now(),
            type: context,
            message: error.message
        });

        // Maintain error history limit
        if (this.status.errors.length > 100) {
            this.status.errors = this.status.errors.slice(-100);
        }
    }
}

module.exports = new AutoTrader();
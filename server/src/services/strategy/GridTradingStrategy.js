const logger = require('../../utils/logger');
const driftService = require('../drift');
const { RateLimiter } = require('../../utils/rateLimiter');
const { validateGridConfig } = require('../../utils/validation');
const { calculateOptimalGridLevels } = require('../../utils/gridCalculator');

class GridTradingStrategy {
    constructor(config = {}) {
        // Validate and set configuration with defaults
        this.config = validateGridConfig({
            symbol: 'SOL-PERP',
            gridLevels: 10,
            gridSpacing: 0.02, // 2% between grid levels
            totalInvestment: 100,
            leverage: 3,
            maxConcurrentOrders: 20,
            emergencyStopLoss: 0.15, // 15% max drawdown
            priceDeviationThreshold: 0.05, // 5% price deviation triggers grid adjustment
            minProfitPerTrade: 0.003, // 0.3% minimum profit per trade
            ...config
        });

        this.grids = [];
        this.activeOrders = new Map();
        this.lastPriceCheck = Date.now();
        this.priceHistory = [];
        this.rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
        this.status = {
            initialized: false,
            running: false,
            lastUpdate: null,
            errors: [],
            metrics: {
                totalTrades: 0,
                successfulTrades: 0,
                failedTrades: 0,
                profitLoss: 0
            }
        };
    }

    async initialize() {
        try {
            if (this.status.initialized) {
                logger.warn('Grid Trading Strategy already initialized');
                return;
            }

            // Get current market data with retry
            const marketData = await this.executeWithRetry(
                () => driftService.getMarketData(this.config.symbol),
                3,
                1000
            );

            if (!marketData || !marketData.price) {
                throw new Error('Invalid market data received');
            }

            const currentPrice = marketData.price;

            // Calculate optimal grid levels
            this.grids = calculateOptimalGridLevels({
                currentPrice,
                levels: this.config.gridLevels,
                spacing: this.config.gridSpacing,
                investment: this.config.totalInvestment,
                leverage: this.config.leverage
            });

            // Validate grid setup
            if (!this.grids.length || this.grids.length > this.config.maxConcurrentOrders) {
                throw new Error('Invalid grid configuration');
            }

            this.status.initialized = true;
            this.status.lastUpdate = Date.now();
            logger.info(`Grid Trading Strategy initialized for ${this.config.symbol} with ${this.grids.length} levels`);

        } catch (error) {
            this.handleError('initialization', error);
            throw error;
        }
    }

    async start() {
        try {
            if (this.status.running) {
                logger.warn('Grid trading strategy already running');
                return;
            }

            if (!this.status.initialized) {
                await this.initialize();
            }

            // Place initial grid orders with rate limiting
            for (const grid of this.grids) {
                await this.rateLimiter.execute(async () => {
                    try {
                        await this.placeGridOrders(grid);
                    } catch (error) {
                        this.handleError('grid order placement', error);
                    }
                });
            }

            // Start monitoring with debounce
            this.startMonitoring();

            this.status.running = true;
            this.status.lastUpdate = Date.now();
            logger.info('Grid trading strategy started');
        } catch (error) {
            this.handleError('startup', error);
            throw error;
        }
    }

    async placeGridOrders(grid) {
        try {
            if (!grid || !grid.price) {
                throw new Error('Invalid grid parameters');
            }

            // Calculate order sizes based on current balance
            const account = await driftService.getAccount();
            const availableBalance = account.freeCollateral;
            
            if (availableBalance < this.config.totalInvestment * 0.1) {
                throw new Error('Insufficient balance for grid orders');
            }

            // Place buy order with position size validation
            const buySize = Math.min(
                grid.buySize,
                availableBalance * this.config.leverage / grid.price
            );

            const buyOrder = await driftService.placePerpOrder({
                marketIndex: this.config.symbol,
                price: grid.price,
                size: buySize,
                side: 'LONG',
                orderType: 'LIMIT',
                reduceOnly: false
            });

            // Place sell order at next grid level with minimum profit check
            const sellPrice = grid.price * (1 + Math.max(
                this.config.gridSpacing,
                this.config.minProfitPerTrade + 0.002 // Adding 0.2% for fees
            ));

            const sellOrder = await driftService.placePerpOrder({
                marketIndex: this.config.symbol,
                price: sellPrice,
                size: buySize,
                side: 'SHORT',
                orderType: 'LIMIT',
                reduceOnly: true
            });

            // Track orders with full details
            this.activeOrders.set(buyOrder.orderId, {
                type: 'BUY',
                grid: grid,
                price: grid.price,
                size: buySize,
                timestamp: Date.now()
            });

            this.activeOrders.set(sellOrder.orderId, {
                type: 'SELL',
                grid: grid,
                price: sellPrice,
                size: buySize,
                timestamp: Date.now()
            });

            grid.active = true;

        } catch (error) {
            this.handleError('order placement', error);
            throw error;
        }
    }

    startMonitoring() {
        // Use debounced price updates to prevent excessive processing
        let priceUpdateTimeout;
        
        driftService.drift.eventEmitter.on('markPriceUpdate', (update) => {
            if (priceUpdateTimeout) clearTimeout(priceUpdateTimeout);
            
            priceUpdateTimeout = setTimeout(async () => {
                try {
                    await this.handlePriceUpdate(update.price);
                } catch (error) {
                    this.handleError('price update handling', error);
                }
            }, 1000); // Debounce for 1 second
        });

        // Monitor order updates efficiently
        driftService.drift.eventEmitter.on('orderUpdate', async (update) => {
            try {
                if (update.status === 'FILLED') {
                    await this.rateLimiter.execute(() => 
                        this.handleOrderFill(update)
                    );
                }
            } catch (error) {
                this.handleError('order update handling', error);
            }
        });

        // Periodic health check
        setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                this.handleError('health check', error);
            }
        }, 60000); // Every minute
    }

    async handleOrderFill(order) {
        const activeOrder = this.activeOrders.get(order.orderId);
        if (!activeOrder) return;

        try {
            // Remove filled order from tracking
            this.activeOrders.delete(order.orderId);

            // Update metrics
            this.status.metrics.totalTrades++;
            this.status.metrics.successfulTrades++;

            const profitLoss = activeOrder.type === 'SELL' 
                ? (order.price - activeOrder.grid.price) * order.size
                : 0;
            
            this.status.metrics.profitLoss += profitLoss;

            // Place new grid orders with position validation
            const account = await driftService.getAccount();
            if (account.freeCollateral < this.config.totalInvestment * 0.1) {
                logger.warn('Insufficient balance for new grid orders');
                return;
            }

            if (activeOrder.type === 'BUY') {
                // Place sell order at profit level
                const sellPrice = order.price * (1 + Math.max(
                    this.config.gridSpacing,
                    this.config.minProfitPerTrade + 0.002
                ));

                const sellOrder = await driftService.placePerpOrder({
                    marketIndex: this.config.symbol,
                    price: sellPrice,
                    size: order.size,
                    side: 'SHORT',
                    orderType: 'LIMIT',
                    reduceOnly: true
                });

                this.activeOrders.set(sellOrder.orderId, {
                    type: 'SELL',
                    grid: activeOrder.grid,
                    price: sellPrice,
                    size: order.size,
                    timestamp: Date.now()
                });

            } else {
                // Place buy order at next lower level
                const buyPrice = order.price * (1 - this.config.gridSpacing);
                const buyOrder = await driftService.placePerpOrder({
                    marketIndex: this.config.symbol,
                    price: buyPrice,
                    size: order.size,
                    side: 'LONG',
                    orderType: 'LIMIT',
                    reduceOnly: false
                });

                this.activeOrders.set(buyOrder.orderId, {
                    type: 'BUY',
                    grid: activeOrder.grid,
                    price: buyPrice,
                    size: order.size,
                    timestamp: Date.now()
                });
            }

        } catch (error) {
            this.status.metrics.failedTrades++;
            this.handleError('order fill handling', error);
        }
    }

    async handlePriceUpdate(currentPrice) {
        try {
            // Store price history for volatility analysis
            this.priceHistory.push({
                price: currentPrice,
                timestamp: Date.now()
            });

            // Keep last hour of price history
            const oneHourAgo = Date.now() - 3600000;
            this.priceHistory = this.priceHistory.filter(p => p.timestamp > oneHourAgo);

            // Check if price is within valid range
            const upperGrid = this.grids[this.grids.length - 1];
            const lowerGrid = this.grids[0];

            const priceDeviation = Math.abs(
                (currentPrice - (upperGrid.price + lowerGrid.price) / 2) / 
                ((upperGrid.price + lowerGrid.price) / 2)
            );

            if (priceDeviation > this.config.priceDeviationThreshold) {
                await this.adjustGrids(currentPrice);
            }

        } catch (error) {
            this.handleError('price update', error);
        }
    }

    async adjustGrids(currentPrice) {
        try {
            logger.info(`Adjusting grids for ${this.config.symbol} at price ${currentPrice}`);

            // Cancel all existing orders safely
            const cancelPromises = Array.from(this.activeOrders.keys()).map(orderId =>
                this.rateLimiter.execute(() => 
                    driftService.cancelOrder(orderId)
                        .catch(error => {
                            logger.error('Error cancelling order:', error);
                        })
                )
            );

            await Promise.all(cancelPromises);

            // Calculate new grid levels
            this.grids = calculateOptimalGridLevels({
                currentPrice,
                levels: this.config.gridLevels,
                spacing: this.config.gridSpacing,
                investment: this.config.totalInvestment,
                leverage: this.config.leverage
            });

            // Clear existing orders tracking
            this.activeOrders.clear();

            // Place new grid orders
            for (const grid of this.grids) {
                await this.rateLimiter.execute(async () => {
                    try {
                        await this.placeGridOrders(grid);
                    } catch (error) {
                        this.handleError('grid adjustment order placement', error);
                    }
                });
            }

            logger.info('Grid levels adjusted successfully');

        } catch (error) {
            this.handleError('grid adjustment', error);
        }
    }

    async performHealthCheck() {
        try {
            // Check for stale orders
            const now = Date.now();
            const staleThreshold = 3600000; // 1 hour

            const staleOrders = Array.from(this.activeOrders.entries())
                .filter(([_, order]) => now - order.timestamp > staleThreshold);

            if (staleOrders.length > 0) {
                logger.warn(`Found ${staleOrders.length} stale orders`);
                
                for (const [orderId] of staleOrders) {
                    await this.rateLimiter.execute(() =>
                        driftService.cancelOrder(orderId)
                            .catch(error => {
                                logger.error('Error cancelling stale order:', error);
                            })
                    );
                }
            }

            // Check profitability
            const profitThreshold = -0.05; // -5% drawdown threshold
            if (this.status.metrics.profitLoss / this.config.totalInvestment < profitThreshold) {
                logger.warn('Strategy performing below threshold, adjusting parameters');
                await this.adjustRiskParameters();
            }

        } catch (error) {
            this.handleError('health check', error);
        }
    }

    async adjustRiskParameters() {
        try {
            // Reduce leverage if losing money
            if (this.status.metrics.profitLoss < 0) {
                this.config.leverage = Math.max(1, this.config.leverage * 0.8);
            }

            // Adjust grid spacing based on volatility
            const volatility = this.calculateVolatility();
            if (volatility > 0.05) { // 5% volatility
                this.config.gridSpacing = Math.min(0.05, this.config.gridSpacing * 1.2);
            }

            // Reinitialize with new parameters
            await this.adjustGrids(this.priceHistory[this.priceHistory.length - 1].price);

        } catch (error) {
            this.handleError('risk parameter adjustment', error);
        }
    }

    calculateVolatility() {
        if (this.priceHistory.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < this.priceHistory.length; i++) {
            const return_ = (this.priceHistory[i].price - this.priceHistory[i-1].price) / 
                           this.priceHistory[i-1].price;
            returns.push(return_);
        }

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    async stop() {
        try {
            logger.info('Stopping grid trading strategy');

            // Cancel all active orders with rate limiting
            const cancelPromises = Array.from(this.activeOrders.keys()).map(orderId =>
                this.rateLimiter.execute(() => 
                    driftService.cancelOrder(orderId)
                        .catch(error => {
                            logger.error('Error cancelling order during shutdown:', error);
                        })
                )
            );

            await Promise.all(cancelPromises);

            this.activeOrders.clear();
            this.status.running = false;
            this.status.lastUpdate = Date.now();

            logger.info('Grid trading strategy stopped');
        } catch (error) {
            this.handleError('shutdown', error);
        }
    }

    getStatus() {
        return {
            symbol: this.config.symbol,
            gridLevels: this.config.gridLevels,
            activeOrders: this.activeOrders.size,
            grids: this.grids.map(grid => ({
                price: grid.price,
                active: grid.active
            })),
            metrics: this.status.metrics,
            rateLimiterStatus: this.rateLimiter.getStatus(),
            errors: this.status.errors.slice(-10) // Last 10 errors
        };
    }

    // Utility methods
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
        logger.error(`Error in GridTradingStrategy (${context}):`, error);
        
        this.status.errors.push({
            time: Date.now(),
            type: context,
            message: error.message
        });

        // Keep error history manageable
        if (this.status.errors.length > 100) {
            this.status.errors = this.status.errors.slice(-100);
        }
    }
}

module.exports = GridTradingStrategy;
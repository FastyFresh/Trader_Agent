const logger = require('../../utils/logger');
const GridTradingStrategy = require('./GridTradingStrategy');
const MomentumStrategy = require('./MomentumStrategy');
const performanceTracker = require('../PerformanceTracker');
const backtestEngine = require('../BacktestEngine');
const markets = require('../../config/markets');

class StrategyFactory {
    constructor() {
        this.strategies = new Map();
        this.optimizations = new Map();
        this.combinations = new Map();
    }

    async createStrategy(type, config = {}) {
        try {
            // Use predefined market configurations
            config.markets = config.markets || Object.keys(markets);
            config.defaultMarket = config.defaultMarket || 'SOL-PERP';

            let strategy;
            switch (type.toLowerCase()) {
                case 'grid':
                    strategy = new GridTradingStrategy({
                        ...config,
                        symbol: config.defaultMarket,
                        gridLevels: 10,
                        gridSpacing: markets[config.defaultMarket].tickSize * 10
                    });
                    break;
                case 'momentum':
                    strategy = new MomentumStrategy({
                        ...config,
                        symbol: config.defaultMarket,
                        timeframe: '1h',
                        momentumThreshold: 0.02
                    });
                    break;
                default:
                    throw new Error(`Unknown strategy type: ${type}`);
            }

            await strategy.initialize();
            this.strategies.set(strategy.id, strategy);

            return strategy;

        } catch (error) {
            logger.error(`Error creating strategy of type ${type}:`, error);
            throw error;
        }
    }

    async optimizeStrategy(strategy, optimizationConfig = {}) {
        try {
            const defaultConfig = {
                populationSize: 20,
                generations: 10,
                mutationRate: 0.1,
                fitnessMetric: 'sharpeRatio',
                market: strategy.config.defaultMarket,
                ...optimizationConfig
            };

            // Generate initial population
            const population = await this.generateInitialPopulation(
                strategy,
                defaultConfig.populationSize,
                defaultConfig.market
            );

            let bestConfig = null;
            let bestFitness = -Infinity;

            // Run genetic algorithm
            for (let gen = 0; gen < defaultConfig.generations; gen++) {
                const results = await Promise.all(
                    population.map(async (config) => {
                        const result = await this.evaluateConfig(strategy, config);
                        return { config, fitness: result[defaultConfig.fitnessMetric] };
                    })
                );

                // Sort by fitness
                results.sort((a, b) => b.fitness - a.fitness);

                // Update best configuration
                if (results[0].fitness > bestFitness) {
                    bestFitness = results[0].fitness;
                    bestConfig = results[0].config;
                }

                // Generate next generation
                population.length = 0;
                population.push(bestConfig); // Elite preservation

                while (population.length < defaultConfig.populationSize) {
                    const parent1 = this.selectParent(results);
                    const parent2 = this.selectParent(results);
                    const child = this.crossover(parent1, parent2);
                    
                    if (Math.random() < defaultConfig.mutationRate) {
                        this.mutate(child, defaultConfig.market);
                    }

                    population.push(child);
                }
            }

            // Store optimization results
            this.optimizations.set(strategy.id, {
                originalConfig: strategy.config,
                optimizedConfig: bestConfig,
                improvement: bestFitness
            });

            return bestConfig;

        } catch (error) {
            logger.error('Error optimizing strategy:', error);
            throw error;
        }
    }

    async generateInitialPopulation(strategy, size, market) {
        const population = [];
        const baseConfig = strategy.config;
        const marketConfig = markets[market];

        for (let i = 0; i < size; i++) {
            const config = this.generateRandomConfig(baseConfig, marketConfig);
            population.push(config);
        }

        return population;
    }

    generateRandomConfig(baseConfig, marketConfig) {
        const config = { ...baseConfig };

        // Adjust parameters based on market configuration
        if (config.gridSpacing) {
            config.gridSpacing = marketConfig.tickSize * (5 + Math.random() * 15); // 5-20x tickSize
        }

        if (config.leverage) {
            config.leverage = marketConfig.minLeverage + 
                Math.random() * (marketConfig.maxLeverage - marketConfig.minLeverage);
        }

        // Adjust other numerical parameters
        for (const [key, value] of Object.entries(config)) {
            if (typeof value === 'number' && key !== 'gridSpacing' && key !== 'leverage') {
                const adjustment = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
                config[key] = value * adjustment;
            }
        }

        return config;
    }

    async evaluateConfig(strategy, config) {
        // Run backtest with config
        const results = await backtestEngine.runBacktest(
            strategy.constructor.name.toLowerCase(),
            config
        );

        return {
            sharpeRatio: results.metrics.sharpeRatio,
            totalReturn: results.metrics.totalReturn,
            maxDrawdown: results.metrics.maxDrawdown,
            winRate: results.metrics.winRate
        };
    }

    selectParent(results) {
        // Tournament selection
        const tournamentSize = 3;
        let best = null;

        for (let i = 0; i < tournamentSize; i++) {
            const candidate = results[Math.floor(Math.random() * results.length)];
            if (!best || candidate.fitness > best.fitness) {
                best = candidate;
            }
        }

        return best.config;
    }

    crossover(parent1, parent2) {
        const child = {};

        for (const key in parent1) {
            // Randomly select from either parent
            child[key] = Math.random() < 0.5 ? parent1[key] : parent2[key];
        }

        return child;
    }

    mutate(config, market) {
        const marketConfig = markets[market];
        const key = Object.keys(config)[Math.floor(Math.random() * Object.keys(config).length)];

        if (key === 'gridSpacing') {
            config[key] = marketConfig.tickSize * (5 + Math.random() * 15);
        } else if (key === 'leverage') {
            config[key] = marketConfig.minLeverage + 
                Math.random() * (marketConfig.maxLeverage - marketConfig.minLeverage);
        } else if (typeof config[key] === 'number') {
            const mutation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            config[key] *= mutation;
        }
    }

    async combineStrategies(strategies, weights) {
        try {
            const combinationId = strategies.map(s => s.id).join('-');
            
            // Create combined strategy configuration
            const combinedConfig = {
                strategies: strategies.map((strategy, index) => ({
                    type: strategy.constructor.name,
                    config: strategy.config,
                    weight: weights[index]
                })),
                totalWeight: weights.reduce((sum, w) => sum + w, 0),
                markets: Object.keys(markets) // Available markets
            };

            // Store combination
            this.combinations.set(combinationId, combinedConfig);

            // Create wrapper strategy that manages all sub-strategies
            const wrapper = {
                id: combinationId,
                config: combinedConfig,
                
                async initialize() {
                    for (const strategy of strategies) {
                        await strategy.initialize();
                    }
                },

                async analyze(marketData) {
                    const signals = await Promise.all(
                        strategies.map((strategy, index) => 
                            strategy.analyze(marketData).then(signal => ({
                                signal,
                                weight: weights[index]
                            }))
                        )
                    );

                    return this.combineSignals(signals);
                },

                combineSignals(signals) {
                    // Weight and combine signals
                    let totalBuySignal = 0;
                    let totalSellSignal = 0;

                    signals.forEach(({ signal, weight }) => {
                        if (signal.side === 'LONG') {
                            totalBuySignal += signal.confidence * weight;
                        } else {
                            totalSellSignal += signal.confidence * weight;
                        }
                    });

                    const netSignal = totalBuySignal - totalSellSignal;
                    const confidence = Math.abs(netSignal) / combinedConfig.totalWeight;

                    if (Math.abs(netSignal) < 0.2) {
                        return null; // No clear signal
                    }

                    return {
                        side: netSignal > 0 ? 'LONG' : 'SHORT',
                        confidence,
                        source: 'combined'
                    };
                }
            };

            return wrapper;

        } catch (error) {
            logger.error('Error combining strategies:', error);
            throw error;
        }
    }

    getStrategyStatus(strategyId) {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) return null;

        return {
            id: strategyId,
            type: strategy.constructor.name,
            config: strategy.config,
            optimization: this.optimizations.get(strategyId),
            combinations: Array.from(this.combinations.entries())
                .filter(([_, combo]) => 
                    combo.strategies.some(s => s.type === strategy.constructor.name)
                )
                .map(([id]) => id),
            markets: Object.keys(markets)
        };
    }

    getAvailableMarkets() {
        return markets;
    }
}

module.exports = new StrategyFactory();
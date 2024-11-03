const logger = require('../utils/logger');
const backtestEngine = require('../services/BacktestEngine');
const strategyFactory = require('../services/strategy/StrategyFactory');
const marketAnalysis = require('../services/MarketAnalysis');
const performanceTracker = require('../services/PerformanceTracker');

class ResearchAgent {
    constructor(config = {}) {
        this.config = {
            targetEquity: 1000000, // $1M target
            initialCapital: 100,   // $100 starting capital
            maxTimeHorizon: 5 * 365, // 5 years in days
            minWinRate: 0.6,      // 60% minimum win rate
            minSharpeRatio: 1.5,  // Minimum Sharpe ratio
            maxDrawdown: 0.2,     // 20% maximum drawdown
            researchIterations: 100,
            ...config
        };

        this.researchResults = new Map();
        this.optimalStrategies = new Map();
        this.riskProfiles = new Map();
    }

    async initialize() {
        try {
            // Initialize required services
            await marketAnalysis.initialize();
            await backtestEngine.initialize();

            // Calculate required growth rate
            const requiredDailyReturn = this.calculateRequiredReturn();
            logger.info('Required daily return:', requiredDailyReturn);

            await this.initializeResearch();
        } catch (error) {
            logger.error('Failed to initialize research agent:', error);
            throw error;
        }
    }

    calculateRequiredReturn() {
        const totalGrowth = this.config.targetEquity / this.config.initialCapital;
        const days = this.config.maxTimeHorizon;
        return Math.pow(totalGrowth, 1/days) - 1;
    }

    async initializeResearch() {
        try {
            // Get market analysis for initial insights
            const marketInsights = await this.gatherMarketInsights();
            
            // Initialize research parameters based on market conditions
            this.researchParams = this.determineResearchParameters(marketInsights);
            
            logger.info('Research parameters initialized:', this.researchParams);
        } catch (error) {
            logger.error('Error initializing research:', error);
            throw error;
        }
    }

    async gatherMarketInsights() {
        const analysis = marketAnalysis.getComprehensiveAnalysis();
        
        return {
            markets: analysis.markets,
            volatility: this.calculateAverageVolatility(analysis),
            correlations: this.extractCorrelations(analysis),
            trends: this.identifyTrends(analysis)
        };
    }

    calculateAverageVolatility(analysis) {
        const volatilities = Object.values(analysis.markets)
            .map(market => market.volatility);
        return volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
    }

    extractCorrelations(analysis) {
        const correlations = {};
        Object.entries(analysis.markets).forEach(([market, data]) => {
            correlations[market] = data.correlations;
        });
        return correlations;
    }

    identifyTrends(analysis) {
        return Object.entries(analysis.markets).reduce((trends, [market, data]) => {
            trends[market] = {
                trend: data.trend.trend,
                strength: data.trend.strength
            };
            return trends;
        }, {});
    }

    determineResearchParameters(insights) {
        const avgVolatility = insights.volatility;
        
        return {
            gridSpacing: Math.max(avgVolatility * 0.1, 0.005), // 0.5% minimum
            momentumThreshold: Math.max(avgVolatility * 0.2, 0.01), // 1% minimum
            leverageRange: this.calculateSafeLeverage(avgVolatility),
            positionSizing: this.determinePositionSizing(insights),
            timeframes: this.selectTimeframes(insights)
        };
    }

    calculateSafeLeverage(volatility) {
        const maxLeverage = Math.min(10, 1 / volatility);
        return {
            min: 1,
            max: maxLeverage,
            default: (1 + maxLeverage) / 2
        };
    }

    determinePositionSizing(insights) {
        const riskFactors = Object.values(insights.markets).map(market => 
            market.volatility * (1 - Math.abs(market.trend.strength))
        );
        
        const avgRisk = riskFactors.reduce((sum, risk) => sum + risk, 0) / riskFactors.length;
        
        return {
            maxPositionSize: Math.min(0.5, 1 / (avgRisk * 10)),
            riskPerTrade: Math.min(0.02, 0.5 / Math.sqrt(avgRisk)),
            scalingFactor: 1 + Math.log10(1 + avgRisk)
        };
    }

    selectTimeframes(insights) {
        const volatilities = Object.values(insights.markets)
            .map(market => market.volatility);
        const avgVolatility = this.calculateAverageVolatility({ markets: insights.markets });

        return volatilities.map(vol => {
            if (vol > avgVolatility * 1.5) return ['5m', '15m', '1h'];
            if (vol > avgVolatility) return ['15m', '1h', '4h'];
            return ['1h', '4h', '1d'];
        }).flat().filter((v, i, a) => a.indexOf(v) === i);
    }

    async researchOptimalStrategies() {
        try {
            logger.info('Starting strategy research...');

            const results = new Map();
            const insights = await this.gatherMarketInsights();

            // Research each market
            for (const [market, data] of Object.entries(insights.markets)) {
                const marketResults = await this.researchMarketStrategies(market, data);
                results.set(market, marketResults);
            }

            // Analyze results and determine optimal combinations
            const optimalStrategies = await this.analyzeResearchResults(results);
            
            // Store research results
            this.researchResults = results;
            this.optimalStrategies = optimalStrategies;

            return optimalStrategies;

        } catch (error) {
            logger.error('Error researching optimal strategies:', error);
            throw error;
        }
    }

    async researchMarketStrategies(market, marketData) {
        const results = {
            grid: await this.researchGridStrategy(market, marketData),
            momentum: await this.researchMomentumStrategy(market, marketData)
        };

        // Research combined strategies
        results.combined = await this.researchCombinedStrategies(market, results);

        return results;
    }

    async researchGridStrategy(market, marketData) {
        const configurations = this.generateGridConfigurations(market, marketData);
        const results = [];

        for (const config of configurations) {
            const strategy = await strategyFactory.createStrategy('grid', {
                ...config,
                market
            });

            const backtest = await backtestEngine.runBacktest(strategy);
            if (this.meetsPerformanceCriteria(backtest)) {
                results.push({ config, performance: backtest.metrics });
            }
        }

        return this.rankStrategies(results);
    }

    async researchMomentumStrategy(market, marketData) {
        const configurations = this.generateMomentumConfigurations(market, marketData);
        const results = [];

        for (const config of configurations) {
            const strategy = await strategyFactory.createStrategy('momentum', {
                ...config,
                market
            });

            const backtest = await backtestEngine.runBacktest(strategy);
            if (this.meetsPerformanceCriteria(backtest)) {
                results.push({ config, performance: backtest.metrics });
            }
        }

        return this.rankStrategies(results);
    }

    async researchCombinedStrategies(market, individualResults) {
        const combinations = this.generateStrategyCombinations(
            individualResults.grid,
            individualResults.momentum
        );

        const results = [];

        for (const combo of combinations) {
            const combined = await strategyFactory.combineStrategies(
                combo.strategies,
                combo.weights
            );

            const backtest = await backtestEngine.runBacktest(combined);
            if (this.meetsPerformanceCriteria(backtest)) {
                results.push({ config: combo, performance: backtest.metrics });
            }
        }

        return this.rankStrategies(results);
    }

    generateGridConfigurations(market, marketData) {
        const { gridSpacing, leverageRange } = this.researchParams;
        const volatility = marketData.volatility;

        const configurations = [];
        const gridLevels = [5, 10, 15, 20];
        const spacingMultiples = [0.5, 1, 1.5, 2];

        for (const levels of gridLevels) {
            for (const spacingMultiple of spacingMultiples) {
                configurations.push({
                    gridLevels: levels,
                    gridSpacing: gridSpacing * spacingMultiple,
                    leverage: Math.min(
                        leverageRange.max,
                        Math.max(leverageRange.min, 1 / volatility)
                    )
                });
            }
        }

        return configurations;
    }

    generateMomentumConfigurations(market, marketData) {
        const { momentumThreshold, leverageRange, timeframes } = this.researchParams;
        const volatility = marketData.volatility;

        const configurations = [];
        const thresholdMultiples = [0.5, 1, 1.5, 2];
        const volumeThresholds = [1.2, 1.5, 2, 2.5];

        for (const timeframe of timeframes) {
            for (const thresholdMult of thresholdMultiples) {
                for (const volumeThresh of volumeThresholds) {
                    configurations.push({
                        timeframe,
                        momentumThreshold: momentumThreshold * thresholdMult,
                        volumeThreshold: volumeThresh,
                        leverage: Math.min(
                            leverageRange.max,
                            Math.max(leverageRange.min, 1 / volatility)
                        )
                    });
                }
            }
        }

        return configurations;
    }

    generateStrategyCombinations(gridResults, momentumResults) {
        const combinations = [];
        const topStrategies = {
            grid: gridResults.slice(0, 3),
            momentum: momentumResults.slice(0, 3)
        };

        const weights = [[0.7, 0.3], [0.5, 0.5], [0.3, 0.7]];

        for (const gridStrategy of topStrategies.grid) {
            for (const momentumStrategy of topStrategies.momentum) {
                for (const [gridWeight, momentumWeight] of weights) {
                    combinations.push({
                        strategies: [gridStrategy, momentumStrategy],
                        weights: [gridWeight, momentumWeight]
                    });
                }
            }
        }

        return combinations;
    }

    meetsPerformanceCriteria(backtest) {
        return (
            backtest.metrics.winRate >= this.config.minWinRate &&
            backtest.metrics.sharpeRatio >= this.config.minSharpeRatio &&
            backtest.metrics.maxDrawdown <= this.config.maxDrawdown &&
            this.projectsToTarget(backtest.metrics)
        );
    }

    projectsToTarget(metrics) {
        const annualizedReturn = metrics.totalReturn * (365 / this.config.maxTimeHorizon);
        const projectedFinal = this.config.initialCapital * 
            Math.pow(1 + annualizedReturn, this.config.maxTimeHorizon / 365);
        
        return projectedFinal >= this.config.targetEquity;
    }

    rankStrategies(results) {
        return results.sort((a, b) => {
            const scoreA = this.calculateStrategyScore(a);
            const scoreB = this.calculateStrategyScore(b);
            return scoreB - scoreA;
        });
    }

    calculateStrategyScore(result) {
        const { sharpeRatio, totalReturn, maxDrawdown, winRate } = result.performance;
        
        // Weight factors based on importance
        const weights = {
            sharpeRatio: 0.3,
            totalReturn: 0.3,
            maxDrawdown: 0.2,
            winRate: 0.2
        };

        return (
            sharpeRatio * weights.sharpeRatio +
            totalReturn * weights.totalReturn +
            (1 - maxDrawdown) * weights.maxDrawdown +
            winRate * weights.winRate
        );
    }

    async analyzeResearchResults(results) {
        const optimalStrategies = new Map();

        for (const [market, marketResults] of results.entries()) {
            // Select best performing strategy combination
            const bestCombined = marketResults.combined[0];
            
            // Create optimal strategy instance
            const strategy = await strategyFactory.createStrategy('combined', {
                ...bestCombined.config,
                market
            });

            // Store optimal strategy with its configuration
            optimalStrategies.set(market, {
                strategy,
                config: bestCombined.config,
                performance: bestCombined.performance,
                riskProfile: this.calculateRiskProfile(bestCombined)
            });
        }

        return optimalStrategies;
    }

    calculateRiskProfile(strategyResult) {
        const { performance } = strategyResult;
        
        return {
            riskScore: this.calculateRiskScore(performance),
            optimalLeverage: this.calculateOptimalLeverage(performance),
            positionSizing: this.calculateOptimalPositionSizing(performance),
            stopLoss: this.calculateOptimalStopLoss(performance)
        };
    }

    calculateRiskScore(performance) {
        const volatilityScore = 1 - (performance.maxDrawdown / this.config.maxDrawdown);
        const returnScore = performance.sharpeRatio / this.config.minSharpeRatio;
        const consistencyScore = performance.winRate / this.config.minWinRate;
        
        return (volatilityScore + returnScore + consistencyScore) / 3;
    }

    calculateOptimalLeverage(performance) {
        const riskScore = this.calculateRiskScore(performance);
        const maxLeverage = this.researchParams.leverageRange.max;
        
        return Math.min(
            maxLeverage,
            maxLeverage * riskScore
        );
    }

    calculateOptimalPositionSizing(performance) {
        const riskScore = this.calculateRiskScore(performance);
        const { maxPositionSize } = this.researchParams.positionSizing;
        
        return {
            maxSize: maxPositionSize * riskScore,
            riskPerTrade: this.researchParams.positionSizing.riskPerTrade * riskScore,
            scaling: this.researchParams.positionSizing.scalingFactor
        };
    }

    calculateOptimalStopLoss(performance) {
        const avgLoss = performance.totalReturn / performance.winRate;
        return Math.min(
            Math.abs(avgLoss) * 1.5,
            this.config.maxDrawdown / 2
        );
    }

    getResearchReport() {
        return {
            parameters: this.researchParams,
            results: Array.from(this.researchResults.entries()).map(([market, results]) => ({
                market,
                gridResults: results.grid.slice(0, 3),
                momentumResults: results.momentum.slice(0, 3),
                combinedResults: results.combined.slice(0, 3)
            })),
            optimalStrategies: Array.from(this.optimalStrategies.entries()).map(([market, data]) => ({
                market,
                config: data.config,
                performance: data.performance,
                riskProfile: data.riskProfile
            }))
        };
    }
}

module.exports = new ResearchAgent();
const logger = require('../utils/logger');
const driftService = require('./drift');

class MarketAnalysis {
    constructor(config = {}) {
        this.config = {
            updateInterval: 5 * 60 * 1000, // 5 minutes
            volatilityWindow: 24, // hours
            trendStrengthThreshold: 0.6, // 60% confidence for trend
            volumeSignificanceThreshold: 1.5, // 50% above average
            correlationWindow: 720, // 30 days of hourly data
            markets: ['SOL-PERP', 'BTC-PERP', 'ETH-PERP'],
            ...config
        };

        this.marketData = new Map();
        this.analysis = new Map();
        this.correlations = new Map();
    }

    async initialize() {
        try {
            // Initialize market data for each market
            for (const market of this.config.markets) {
                await this.initializeMarketData(market);
            }

            // Start market analysis
            this.startAnalysis();

            logger.info('Market Analysis Service initialized');
        } catch (error) {
            logger.error('Failed to initialize market analysis:', error);
            throw error;
        }
    }

    async initializeMarketData(market) {
        try {
            // Get historical data
            const historicalData = await driftService.getHistoricalData(
                market,
                '1h',
                new Date(Date.now() - this.config.correlationWindow * 60 * 60 * 1000),
                new Date()
            );

            this.marketData.set(market, historicalData);
            
        } catch (error) {
            logger.error(`Error initializing market data for ${market}:`, error);
            throw error;
        }
    }

    startAnalysis() {
        // Regular market analysis
        setInterval(() => this.updateAnalysis(), this.config.updateInterval);

        // Subscribe to real-time market data
        for (const market of this.config.markets) {
            driftService.drift.eventEmitter.on('markPriceUpdate', async (update) => {
                if (update.marketIndex === market) {
                    await this.handlePriceUpdate(market, update);
                }
            });
        }
    }

    async updateAnalysis() {
        try {
            for (const market of this.config.markets) {
                const marketData = this.marketData.get(market);
                if (!marketData) continue;

                // Calculate market metrics
                const volatility = this.calculateVolatility(marketData);
                const trend = this.analyzeTrend(marketData);
                const volume = this.analyzeVolume(marketData);
                const support = this.findSupportResistance(marketData).support;
                const resistance = this.findSupportResistance(marketData).resistance;

                this.analysis.set(market, {
                    timestamp: Date.now(),
                    volatility,
                    trend,
                    volume,
                    support,
                    resistance,
                    momentum: this.calculateMomentum(marketData)
                });
            }

            // Update correlations
            await this.updateCorrelations();

            logger.info('Market analysis updated');

        } catch (error) {
            logger.error('Error updating market analysis:', error);
        }
    }

    async handlePriceUpdate(market, update) {
        try {
            const marketData = this.marketData.get(market);
            if (!marketData) return;

            // Add new price data
            marketData.push({
                timestamp: update.timestamp,
                price: update.price,
                volume: update.volume
            });

            // Keep only required window of data
            while (marketData.length > this.config.correlationWindow) {
                marketData.shift();
            }

            // Update market data
            this.marketData.set(market, marketData);

        } catch (error) {
            logger.error(`Error handling price update for ${market}:`, error);
        }
    }

    calculateVolatility(data) {
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i].price - data[i-1].price) / data[i-1].price);
        }

        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
        const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length;
        
        return Math.sqrt(variance * 24); // Annualized volatility
    }

    analyzeTrend(data) {
        const prices = data.map(d => d.price);
        const sma20 = this.calculateSMA(prices, 20);
        const sma50 = this.calculateSMA(prices, 50);
        
        const currentSMA20 = sma20[sma20.length - 1];
        const currentSMA50 = sma50[sma50.length - 1];
        const currentPrice = prices[prices.length - 1];

        let trend = 'NEUTRAL';
        let strength = 0;

        if (currentPrice > currentSMA20 && currentSMA20 > currentSMA50) {
            trend = 'UPTREND';
            strength = (currentPrice - currentSMA50) / currentSMA50;
        } else if (currentPrice < currentSMA20 && currentSMA20 < currentSMA50) {
            trend = 'DOWNTREND';
            strength = (currentSMA50 - currentPrice) / currentSMA50;
        }

        return { trend, strength };
    }

    analyzeVolume(data) {
        const volumes = data.map(d => d.volume);
        const averageVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
        const currentVolume = volumes[volumes.length - 1];
        
        return {
            current: currentVolume,
            average: averageVolume,
            ratio: currentVolume / averageVolume,
            significant: currentVolume > averageVolume * this.config.volumeSignificanceThreshold
        };
    }

    findSupportResistance(data) {
        const prices = data.map(d => d.price);
        const pricePoints = new Map();

        // Count price point occurrences
        for (const price of prices) {
            const roundedPrice = Math.round(price * 100) / 100;
            pricePoints.set(roundedPrice, (pricePoints.get(roundedPrice) || 0) + 1);
        }

        // Find local maxima/minima
        const currentPrice = prices[prices.length - 1];
        let support = currentPrice;
        let resistance = currentPrice;

        for (const [price, count] of pricePoints.entries()) {
            if (count >= 3) { // Minimum 3 touches
                if (price < currentPrice && price > support) {
                    support = price;
                } else if (price > currentPrice && price < resistance) {
                    resistance = price;
                }
            }
        }

        return { support, resistance };
    }

    calculateMomentum(data) {
        const prices = data.map(d => d.price);
        const rsi = this.calculateRSI(prices, 14);
        const macd = this.calculateMACD(prices);
        
        return {
            rsi: rsi[rsi.length - 1],
            macd: macd.histogram[macd.histogram.length - 1],
            trend: this.analyzeTrend(data)
        };
    }

    calculateRSI(prices, period = 14) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < prices.length; i++) {
            const difference = prices[i] - prices[i-1];
            gains.push(Math.max(difference, 0));
            losses.push(Math.max(-difference, 0));
        }
        
        const averageGain = gains.slice(-period).reduce((sum, g) => sum + g, 0) / period;
        const averageLoss = losses.slice(-period).reduce((sum, l) => sum + l, 0) / period;
        
        const rs = averageGain / (averageLoss === 0 ? 1 : averageLoss);
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(prices, short = 12, long = 26, signal = 9) {
        const shortEMA = this.calculateEMA(prices, short);
        const longEMA = this.calculateEMA(prices, long);
        const macdLine = shortEMA.map((s, i) => s - longEMA[i]);
        const signalLine = this.calculateEMA(macdLine, signal);
        const histogram = macdLine.map((m, i) => m - signalLine[i]);
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram
        };
    }

    calculateSMA(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }

    calculateEMA(data, period) {
        const multiplier = 2 / (period + 1);
        const result = [data[0]];
        
        for (let i = 1; i < data.length; i++) {
            const ema = (data[i] - result[i-1]) * multiplier + result[i-1];
            result.push(ema);
        }
        
        return result;
    }

    async updateCorrelations() {
        try {
            const markets = Array.from(this.marketData.keys());
            const correlationMatrix = new Map();

            for (let i = 0; i < markets.length; i++) {
                for (let j = i + 1; j < markets.length; j++) {
                    const market1 = markets[i];
                    const market2 = markets[j];
                    
                    const correlation = this.calculateCorrelation(
                        this.marketData.get(market1),
                        this.marketData.get(market2)
                    );

                    correlationMatrix.set(`${market1}-${market2}`, correlation);
                }
            }

            this.correlations = correlationMatrix;

        } catch (error) {
            logger.error('Error updating correlations:', error);
        }
    }

    calculateCorrelation(data1, data2) {
        const prices1 = data1.map(d => d.price);
        const prices2 = data2.map(d => d.price);
        const n = Math.min(prices1.length, prices2.length);

        const mean1 = prices1.reduce((sum, p) => sum + p, 0) / n;
        const mean2 = prices2.reduce((sum, p) => sum + p, 0) / n;

        let numerator = 0;
        let denom1 = 0;
        let denom2 = 0;

        for (let i = 0; i < n; i++) {
            const diff1 = prices1[i] - mean1;
            const diff2 = prices2[i] - mean2;
            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
        }

        return numerator / Math.sqrt(denom1 * denom2);
    }

    getMarketAnalysis(market) {
        return this.analysis.get(market) || null;
    }

    getCorrelation(market1, market2) {
        return this.correlations.get(`${market1}-${market2}`) || 
               this.correlations.get(`${market2}-${market1}`) || 
               null;
    }

    getComprehensiveAnalysis() {
        return {
            timestamp: Date.now(),
            markets: Object.fromEntries(
                Array.from(this.analysis.entries()).map(([market, analysis]) => [
                    market,
                    {
                        ...analysis,
                        correlations: Object.fromEntries(
                            Array.from(this.correlations.entries())
                                .filter(([pair]) => pair.includes(market))
                                .map(([pair, correlation]) => [
                                    pair.replace(`${market}-`, '').replace(`-${market}`, ''),
                                    correlation
                                ])
                        )
                    }
                ])
            )
        };
    }
}

module.exports = new MarketAnalysis();
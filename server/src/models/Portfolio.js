const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    averageEntryPrice: {
        type: Number,
        required: true,
        min: 0
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0
    },
    marketValue: {
        type: Number,
        required: true
    },
    unrealizedPnL: {
        type: Number,
        default: 0
    },
    realizedPnL: {
        type: Number,
        default: 0
    }
});

const PerformanceSchema = new mongoose.Schema({
    dailyReturn: {
        type: Number,
        default: 0
    },
    weeklyReturn: {
        type: Number,
        default: 0
    },
    monthlyReturn: {
        type: Number,
        default: 0
    },
    yearlyReturn: {
        type: Number,
        default: 0
    },
    allTimeReturn: {
        type: Number,
        default: 0
    },
    sharpeRatio: {
        type: Number,
        default: 0
    },
    maxDrawdown: {
        type: Number,
        default: 0
    }
});

const RiskMetricsSchema = new mongoose.Schema({
    portfolioBeta: {
        type: Number,
        default: 0
    },
    valueAtRisk: {
        type: Number,
        default: 0
    },
    marginUtilization: {
        type: Number,
        default: 0
    }
});

const PortfolioSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    totalEquity: {
        type: Number,
        required: true,
        min: 0
    },
    cashBalance: {
        type: Number,
        required: true,
        min: 0
    },
    positions: [PositionSchema],
    performance: PerformanceSchema,
    riskMetrics: RiskMetricsSchema,
    historicalValues: [{
        timestamp: {
            type: Date,
            required: true
        },
        value: {
            type: Number,
            required: true
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Methods
PortfolioSchema.methods.calculateTotalValue = function() {
    const positionsValue = this.positions.reduce((total, position) => {
        return total + (position.quantity * position.currentPrice);
    }, 0);
    
    return this.cashBalance + positionsValue;
};

PortfolioSchema.methods.updatePosition = async function(trade) {
    const position = this.positions.find(p => p.symbol === trade.symbol);
    
    if (trade.type === 'BUY') {
        if (position) {
            // Update existing position
            const totalQuantity = position.quantity + trade.quantity;
            const totalCost = position.quantity * position.averageEntryPrice + 
                            trade.quantity * trade.price;
            
            position.quantity = totalQuantity;
            position.averageEntryPrice = totalCost / totalQuantity;
            position.currentPrice = trade.price;
            position.marketValue = totalQuantity * trade.price;
        } else {
            // Create new position
            this.positions.push({
                symbol: trade.symbol,
                quantity: trade.quantity,
                averageEntryPrice: trade.price,
                currentPrice: trade.price,
                marketValue: trade.quantity * trade.price
            });
        }
        
        // Deduct cash
        this.cashBalance -= trade.quantity * trade.price;
    } else {
        if (!position) {
            throw new Error(`No position found for ${trade.symbol}`);
        }
        
        // Calculate realized P&L
        const tradePnL = (trade.price - position.averageEntryPrice) * trade.quantity;
        position.realizedPnL += tradePnL;
        
        // Update position
        position.quantity -= trade.quantity;
        position.marketValue = position.quantity * position.currentPrice;
        
        // Add cash
        this.cashBalance += trade.quantity * trade.price;
        
        // Remove position if quantity is 0
        if (position.quantity === 0) {
            this.positions = this.positions.filter(p => p.symbol !== trade.symbol);
        }
    }
    
    // Update total equity
    this.totalEquity = this.calculateTotalValue();
    
    // Add historical value
    this.historicalValues.push({
        timestamp: new Date(),
        value: this.totalEquity
    });
    
    // Keep only last 365 days of historical values
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    this.historicalValues = this.historicalValues.filter(h => h.timestamp >= oneYearAgo);
    
    this.lastUpdated = new Date();
    await this.save();
};

PortfolioSchema.methods.calculateReturns = function() {
    if (!this.historicalValues.length) return null;
    
    const currentValue = this.totalEquity;
    const initialValue = 500; // Initial investment
    
    // Sort historical values by timestamp
    const sortedValues = this.historicalValues.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate different timeframe returns
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const findValueAtDate = (date) => {
        const value = sortedValues.find(v => v.timestamp >= date);
        return value ? value.value : initialValue;
    };
    
    return {
        totalReturn: ((currentValue - initialValue) / initialValue) * 100,
        dailyReturn: ((currentValue - findValueAtDate(dayAgo)) / findValueAtDate(dayAgo)) * 100,
        weeklyReturn: ((currentValue - findValueAtDate(weekAgo)) / findValueAtDate(weekAgo)) * 100,
        monthlyReturn: ((currentValue - findValueAtDate(monthAgo)) / findValueAtDate(monthAgo)) * 100,
        yearlyReturn: ((currentValue - findValueAtDate(yearAgo)) / findValueAtDate(yearAgo)) * 100
    };
};

module.exports = mongoose.model('Portfolio', PortfolioSchema);
const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Quantity must be greater than 0'
        }
    },
    price: {
        type: Number,
        required: true,
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Price must be greater than 0'
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'FAILED'],
        default: 'PENDING',
        index: true
    },
    strategy: {
        type: String,
        required: true,
        index: true
    },
    stopLoss: {
        type: Number,
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Stop loss must be greater than 0'
        }
    },
    takeProfit: {
        type: Number,
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Take profit must be greater than 0'
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    executionDetails: {
        orderId: String,
        executionPrice: Number,
        executionTime: Date,
        commission: Number,
        commissionAsset: String
    },
    metadata: {
        riskScore: Number,
        confidence: Number,
        marketConditions: {
            volatility: Number,
            trend: String,
            volume: Number
        }
    }
}, {
    timestamps: true
});

// Methods
TradeSchema.methods.calculateValue = function() {
    return this.quantity * this.price;
};

TradeSchema.methods.calculatePnL = function(currentPrice) {
    if (!currentPrice) return null;
    
    const value = this.quantity * (currentPrice - this.price);
    return this.type === 'BUY' ? value : -value;
};

TradeSchema.methods.calculatePnLPercent = function(currentPrice) {
    const pnl = this.calculatePnL(currentPrice);
    if (pnl === null) return null;
    
    const initialValue = this.quantity * this.price;
    return (pnl / initialValue) * 100;
};

// Static methods
TradeSchema.statics.getTradesByDateRange = async function(startDate, endDate) {
    return this.find({
        timestamp: {
            $gte: startDate,
            $lte: endDate || new Date()
        }
    }).sort({ timestamp: -1 });
};

TradeSchema.statics.getTradesBySymbol = async function(symbol, limit = 100) {
    return this.find({ symbol })
        .sort({ timestamp: -1 })
        .limit(limit);
};

TradeSchema.statics.getActiveTradesByStrategy = async function(strategy) {
    return this.find({
        strategy,
        status: 'ACTIVE'
    }).sort({ timestamp: -1 });
};

TradeSchema.statics.getStrategyPerformance = async function(strategy, startDate, endDate) {
    const trades = await this.find({
        strategy,
        status: 'COMPLETED',
        timestamp: {
            $gte: startDate,
            $lte: endDate || new Date()
        }
    });

    if (!trades.length) return null;

    const profitableTrades = trades.filter(t => t.calculatePnL(t.executionDetails.executionPrice) > 0);
    
    return {
        totalTrades: trades.length,
        profitableTrades: profitableTrades.length,
        winRate: (profitableTrades.length / trades.length) * 100,
        totalPnL: trades.reduce((sum, trade) => {
            const pnl = trade.calculatePnL(trade.executionDetails.executionPrice);
            return sum + (pnl || 0);
        }, 0)
    };
};

// Pre-save middleware
TradeSchema.pre('save', function(next) {
    if (this.isNew) {
        if (!this.stopLoss) {
            // Set default stop loss (2% for now)
            this.stopLoss = this.type === 'BUY' 
                ? this.price * 0.98 
                : this.price * 1.02;
        }
        if (!this.takeProfit) {
            // Set default take profit (4% for now)
            this.takeProfit = this.type === 'BUY'
                ? this.price * 1.04
                : this.price * 0.96;
        }
    }
    next();
});

module.exports = mongoose.model('Trade', TradeSchema);
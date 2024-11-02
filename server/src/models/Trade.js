const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    strategy: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'FAILED'],
        default: 'PENDING'
    },
    stopLoss: {
        type: Number,
        required: true
    },
    takeProfit: {
        type: Number,
        required: true
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
});

TradeSchema.methods.calculatePnL = function() {
    if (this.status !== 'EXECUTED' || !this.executionDetails.executionPrice) {
        return null;
    }

    const currentValue = this.quantity * this.price;
    const costBasis = this.quantity * this.executionDetails.executionPrice;
    
    return this.type === 'BUY' 
        ? currentValue - costBasis 
        : costBasis - currentValue;
};

TradeSchema.methods.shouldTriggerStopLoss = function(currentPrice) {
    if (this.status !== 'EXECUTED') return false;

    return this.type === 'BUY' 
        ? currentPrice <= this.stopLoss
        : currentPrice >= this.stopLoss;
};

TradeSchema.methods.shouldTriggerTakeProfit = function(currentPrice) {
    if (this.status !== 'EXECUTED') return false;

    return this.type === 'BUY'
        ? currentPrice >= this.takeProfit
        : currentPrice <= this.takeProfit;
};

TradeSchema.pre('save', function(next) {
    if (this.isNew) {
        // Validate trade parameters
        if (this.quantity <= 0) {
            next(new Error('Trade quantity must be positive'));
        }
        if (this.price <= 0) {
            next(new Error('Trade price must be positive'));
        }
        if (this.stopLoss <= 0) {
            next(new Error('Stop loss must be positive'));
        }
        if (this.takeProfit <= 0) {
            next(new Error('Take profit must be positive'));
        }
    }
    next();
});

module.exports = mongoose.model('Trade', TradeSchema);
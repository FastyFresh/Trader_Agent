const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
    totalEquity: {
        type: Number,
        required: true
    },
    cashBalance: {
        type: Number,
        required: true
    },
    positions: [{
        symbol: String,
        quantity: Number,
        averageEntryPrice: Number,
        currentPrice: Number,
        marketValue: Number,
        unrealizedPnL: Number,
        realizedPnL: Number
    }],
    performance: {
        dailyReturn: Number,
        weeklyReturn: Number,
        monthlyReturn: Number,
        yearlyReturn: Number,
        allTimeReturn: Number,
        sharpeRatio: Number,
        maxDrawdown: Number
    },
    riskMetrics: {
        portfolioBeta: Number,
        valueAtRisk: Number,
        marginUtilization: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

PortfolioSchema.methods.calculateTotalValue = function() {
    const positionsValue = this.positions.reduce((total, position) => {
        return total + (position.quantity * position.currentPrice);
    }, 0);
    
    return this.cashBalance + positionsValue;
};

PortfolioSchema.methods.calculateReturns = function() {
    const currentValue = this.calculateTotalValue();
    const initialValue = 500; // Initial investment
    
    return {
        absoluteReturn: currentValue - initialValue,
        percentageReturn: ((currentValue - initialValue) / initialValue) * 100
    };
};

PortfolioSchema.methods.updatePosition = function(trade) {
    const position = this.positions.find(p => p.symbol === trade.symbol);
    
    if (position) {
        if (trade.type === 'BUY') {
            const totalCost = position.quantity * position.averageEntryPrice +
                            trade.quantity * trade.price;
            const totalQuantity = position.quantity + trade.quantity;
            position.averageEntryPrice = totalCost / totalQuantity;
            position.quantity = totalQuantity;
        } else {
            position.quantity -= trade.quantity;
            if (position.quantity <= 0) {
                this.positions = this.positions.filter(p => p.symbol !== trade.symbol);
            }
        }
    } else if (trade.type === 'BUY') {
        this.positions.push({
            symbol: trade.symbol,
            quantity: trade.quantity,
            averageEntryPrice: trade.price,
            currentPrice: trade.price,
            marketValue: trade.quantity * trade.price,
            unrealizedPnL: 0,
            realizedPnL: 0
        });
    }
    
    this.lastUpdated = new Date();
};

PortfolioSchema.methods.updateMetrics = function(marketData = {}) {
    // Update position market values and P&L
    this.positions.forEach(position => {
        const currentPrice = marketData[position.symbol]?.price || position.currentPrice;
        position.currentPrice = currentPrice;
        position.marketValue = position.quantity * currentPrice;
        position.unrealizedPnL = position.marketValue - 
            (position.quantity * position.averageEntryPrice);
    });

    // Update total equity
    this.totalEquity = this.calculateTotalValue();

    // Update performance metrics
    const returns = this.calculateReturns();
    this.performance = {
        ...this.performance,
        allTimeReturn: returns.percentageReturn
    };

    this.lastUpdated = new Date();
};

module.exports = mongoose.model('Portfolio', PortfolioSchema);
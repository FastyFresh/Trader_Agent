function calculateOptimalGridLevels({ currentPrice, levels, spacing, investment, leverage }) {
    const grids = [];
    const upperLevels = Math.floor(levels / 2);
    const lowerLevels = levels - upperLevels;
    const investmentPerGrid = investment / levels;

    // Calculate upper grid levels
    for (let i = 1; i <= upperLevels; i++) {
        const priceLevel = currentPrice * (1 + (i * spacing));
        const size = (investmentPerGrid * leverage) / priceLevel;

        grids.push({
            price: priceLevel,
            buySize: size,
            sellSize: size,
            active: false,
            type: 'upper'
        });
    }

    // Add current price level
    grids.push({
        price: currentPrice,
        buySize: (investmentPerGrid * leverage) / currentPrice,
        sellSize: (investmentPerGrid * leverage) / currentPrice,
        active: false,
        type: 'middle'
    });

    // Calculate lower grid levels
    for (let i = 1; i <= lowerLevels; i++) {
        const priceLevel = currentPrice * (1 - (i * spacing));
        const size = (investmentPerGrid * leverage) / priceLevel;

        grids.push({
            price: priceLevel,
            buySize: size,
            sellSize: size,
            active: false,
            type: 'lower'
        });
    }

    // Sort grids by price from lowest to highest
    return grids.sort((a, b) => a.price - b.price);
}

function optimizeGridParameters(volatility, currentPrice, averageSpread) {
    // Adjust grid spacing based on volatility
    let optimalSpacing = Math.max(
        volatility / 4, // Use 1/4th of volatility as minimum spacing
        averageSpread * 2 // Ensure spacing is at least 2x the spread
    );

    // Cap spacing at reasonable levels
    optimalSpacing = Math.min(optimalSpacing, 0.05); // Max 5% spacing

    // Calculate optimal number of grid levels based on price and volatility
    const optimalLevels = Math.floor(10 * Math.sqrt(volatility));

    // Ensure minimum and maximum levels
    const gridLevels = Math.min(Math.max(optimalLevels, 4), 20);

    return {
        gridSpacing: optimalSpacing,
        gridLevels: gridLevels
    };
}

function calculateGridMetrics(grids, currentPrice) {
    const metrics = {
        totalLevels: grids.length,
        priceRange: {
            lowest: grids[0].price,
            highest: grids[grids.length - 1].price
        },
        averageSpacing: 0,
        potentialProfit: 0,
        activeGrids: 0
    };

    // Calculate average spacing and potential profit
    let totalSpacing = 0;
    for (let i = 1; i < grids.length; i++) {
        const spacing = (grids[i].price - grids[i-1].price) / grids[i-1].price;
        totalSpacing += spacing;

        // Calculate potential profit if price moves through entire grid
        const profitOnGrid = (grids[i].price - grids[i-1].price) * grids[i].buySize;
        metrics.potentialProfit += profitOnGrid;
    }

    metrics.averageSpacing = totalSpacing / (grids.length - 1);
    metrics.activeGrids = grids.filter(grid => grid.active).length;

    return metrics;
}

module.exports = {
    calculateOptimalGridLevels,
    optimizeGridParameters,
    calculateGridMetrics
};
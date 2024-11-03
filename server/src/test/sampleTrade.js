const driftService = require('../services/drift');
const logger = require('../utils/logger');

async function executeSampleTrade() {
    try {
        logger.info('Starting sample trade execution...');
        
        // Initialize drift service first
        await driftService.initialize();
        logger.info('Drift service initialized');
        
        // Get SOL-PERP market data
        const marketData = await driftService.getMarketData('SOL-PERP');
        logger.info('Current SOL price:', marketData.market.currentPrice);

        // Calculate position size (using 20% of available balance)
        const account = await driftService.getAccount();
        const positionSize = account.equity * 0.2 / marketData.market.currentPrice;

        // Place a long order
        const order = await driftService.placePerpOrder({
            marketIndex: 'SOL-PERP',
            price: marketData.market.currentPrice,
            size: positionSize,
            side: 'LONG',
            orderType: 'MARKET'
        });

        logger.info('Sample trade executed:', {
            market: 'SOL-PERP',
            side: 'LONG',
            size: positionSize,
            price: marketData.market.currentPrice
        });

        // Set stop loss (2% below entry)
        const stopLossPrice = marketData.market.currentPrice * 0.98;
        await driftService.placeStopLoss('SOL-PERP', stopLossPrice, positionSize);
        logger.info('Stop loss placed at:', stopLossPrice);

        // Set take profit (2% above entry)
        const takeProfitPrice = marketData.market.currentPrice * 1.02;
        await driftService.placeTakeProfit('SOL-PERP', takeProfitPrice, positionSize);
        logger.info('Take profit placed at:', takeProfitPrice);

        // Check position after order
        const position = await driftService.getPosition('SOL-PERP');
        logger.info('Current position:', position);

        return {
            success: true,
            order: order,
            position: position,
            stopLoss: stopLossPrice,
            takeProfit: takeProfitPrice
        };

    } catch (error) {
        logger.error('Error executing sample trade:', error);
        throw error;
    }
}

// Execute the sample trade
console.log('Executing sample trade...');
executeSampleTrade()
    .then(result => {
        console.log('Sample trade completed successfully:', JSON.stringify(result, null, 2));
        // Keep the process running for a bit to let async operations complete
        setTimeout(() => process.exit(0), 5000);
    })
    .catch(error => {
        console.error('Sample trade failed:', error);
        process.exit(1);
    });
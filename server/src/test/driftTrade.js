const driftService = require('../services/drift');
const logger = require('../utils/logger');

async function testDriftTrading() {
    try {
        // 1. Initialize Drift service
        await driftService.initialize();
        
        // 2. Get market data for BTC-PERP (market index 0)
        const marketData = await driftService.getMarketData(0);
        logger.info('BTC-PERP Market Data:', {
            price: marketData.market.currentPrice,
            funding: marketData.fundingRate,
            bestBid: marketData.orderbook.bids[0],
            bestAsk: marketData.orderbook.asks[0]
        });

        // 3. Set leverage to 2x
        await driftService.setLeverage(0, 2);

        // 4. Calculate order size (0.01 BTC)
        const orderSize = 0.01;
        const currentPrice = marketData.market.currentPrice;

        // 5. Place a limit buy order slightly below best ask
        const buyPrice = currentPrice * 0.999; // 0.1% below current price
        logger.info('Placing limit buy order:', {
            marketIndex: 0,
            size: orderSize,
            price: buyPrice
        });

        const buyOrder = await driftService.placePerpOrder({
            marketIndex: 0,
            side: 'BUY',
            size: orderSize,
            price: buyPrice,
            orderType: 'LIMIT'
        });
        logger.info('Buy order placed:', buyOrder);

        // 6. Wait for order status (30 seconds)
        logger.info('Waiting 30 seconds for order execution...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // 7. Check position
        const position = await driftService.getPosition(0);
        if (position) {
            logger.info('Position opened:', {
                size: position.baseAssetAmount,
                entryPrice: position.entryPrice,
                unrealizedPnl: position.unrealizedPnl
            });

            // 8. Place a take profit sell order
            const takeProfitPrice = position.entryPrice * 1.02; // 2% profit target
            const sellOrder = await driftService.placePerpOrder({
                marketIndex: 0,
                side: 'SELL',
                size: position.baseAssetAmount,
                price: takeProfitPrice,
                orderType: 'LIMIT',
                reduceOnly: true
            });
            logger.info('Take profit order placed:', sellOrder);
        } else {
            logger.info('No position opened, checking open orders');
            const openOrders = await driftService.getOpenOrders();
            logger.info('Open orders:', openOrders);

            // Cancel original order if not filled
            if (openOrders.length > 0) {
                await driftService.cancelOrder(buyOrder.orderId);
                logger.info('Cancelled unfilled order:', buyOrder.orderId);
            }
        }

        logger.info('Trading test completed successfully');
    } catch (error) {
        logger.error('Trading test failed:', error);
        
        if (error.response) {
            logger.error('API Error:', {
                status: error.response.status,
                data: error.response.data
            });
        }
    } finally {
        driftService.cleanup();
    }
}

// Run the test if called directly
if (require.main === module) {
    testDriftTrading().catch(console.error);
}

module.exports = testDriftTrading;
const coinbaseService = require('../services/coinbase');
const logger = require('../utils/logger');

async function testCoinbaseTrading() {
    try {
        // 1. Initialize Coinbase service
        await coinbaseService.initialize();
        
        // 2. Get account information
        const accounts = await coinbaseService.getAccounts();
        logger.info('Account Information:', accounts);

        // 3. Get market data for BTC-USD
        const btcTicker = await coinbaseService.getProductTicker('BTC-USD');
        logger.info('BTC-USD Ticker:', btcTicker);

        // 4. Get order book to see current prices
        const orderBook = await coinbaseService.getProductBook('BTC-USD', 1);
        logger.info('BTC-USD Order Book:', orderBook);

        // 5. Calculate order size (0.001 BTC minimum)
        const bestBid = parseFloat(orderBook.bids[0][0]);
        const orderSize = 0.001; // Minimum order size

        // 6. Place a limit buy order slightly below best bid
        const buyPrice = (bestBid * 0.999).toFixed(2); // 0.1% below best bid
        logger.info('Placing limit buy order:', {
            product_id: 'BTC-USD',
            size: orderSize,
            price: buyPrice
        });

        const buyOrder = await coinbaseService.createLimitOrder(
            'BTC-USD',
            'BUY',
            orderSize,
            buyPrice
        );
        logger.info('Buy order placed:', buyOrder);

        // 7. Wait for order status (30 seconds)
        logger.info('Waiting 30 seconds for order execution...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // 8. Check order status
        const orderStatus = await coinbaseService.getOrder(buyOrder.order_id);
        logger.info('Order status:', orderStatus);

        // 9. If order filled, place sell order
        if (orderStatus.status === 'FILLED') {
            const bestAsk = parseFloat(orderBook.asks[0][0]);
            const sellPrice = (bestAsk * 1.001).toFixed(2); // 0.1% above best ask

            logger.info('Placing limit sell order:', {
                product_id: 'BTC-USD',
                size: orderSize,
                price: sellPrice
            });

            const sellOrder = await coinbaseService.createLimitOrder(
                'BTC-USD',
                'SELL',
                orderSize,
                sellPrice
            );
            logger.info('Sell order placed:', sellOrder);
        } else {
            // Cancel unfilled order
            await coinbaseService.cancelOrder(buyOrder.order_id);
            logger.info('Cancelled unfilled order:', buyOrder.order_id);
        }

        // 10. Get open orders
        const openOrders = await coinbaseService.getOpenOrders();
        logger.info('Open orders:', openOrders);

        // 11. Get current positions
        const positions = await coinbaseService.getPositions();
        logger.info('Current positions:', positions);

        logger.info('Trading test completed successfully');
    } catch (error) {
        logger.error('Trading test failed:', error);
        
        if (error.response) {
            logger.error('API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
    } finally {
        coinbaseService.cleanup();
    }
}

// Run the test if called directly
if (require.main === module) {
    testCoinbaseTrading().catch(console.error);
}

module.exports = testCoinbaseTrading;
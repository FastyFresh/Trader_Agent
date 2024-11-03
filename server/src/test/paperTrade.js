const alpacaService = require('../services/alpaca');
const logger = require('../utils/logger');

async function testPaperTrading() {
    try {
        // 1. Initialize Alpaca service
        await alpacaService.initialize();
        
        // 2. Get account information
        const account = await alpacaService.getAccountInfo();
        logger.info('Account Status:', {
            equity: account.equity,
            buyingPower: account.buying_power,
            cash: account.cash
        });

        // 3. Get latest quote for BTCUSD
        logger.info('Getting latest BTC quote...');
        const btcQuote = await alpacaService.alpaca.getLatestQuote('BTCUSD');
        logger.info('Latest BTC quote:', {
            askPrice: btcQuote.AskPrice,
            bidPrice: btcQuote.BidPrice,
            timestamp: btcQuote.Timestamp
        });

        // 4. Place a test buy order using latest ask price
        const buyOrder = await alpacaService.executeOrder({
            symbol: 'BTCUSD',
            quantity: 0.001, // Minimum order size for BTC
            side: 'buy',
            type: 'limit',
            limitPrice: btcQuote.AskPrice // Use current ask price
        });
        logger.info('Buy order placed:', {
            id: buyOrder.id,
            symbol: buyOrder.symbol,
            quantity: buyOrder.qty,
            side: buyOrder.side,
            type: buyOrder.type,
            limitPrice: buyOrder.limit_price,
            status: buyOrder.status
        });

        // 5. Wait for order status (30 seconds)
        logger.info('Waiting 30 seconds for order execution...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // 6. Check order status
        const orderStatus = await alpacaService.alpaca.getOrder(buyOrder.id);
        logger.info('Order status:', {
            id: orderStatus.id,
            status: orderStatus.status,
            filledQty: orderStatus.filled_qty,
            filledAvgPrice: orderStatus.filled_avg_price
        });
        
        // 7. Get position information if order filled
        if (orderStatus.status === 'filled') {
            const position = await alpacaService.getPosition('BTCUSD');
            logger.info('Position opened:', {
                symbol: position.symbol,
                quantity: position.qty,
                entryPrice: position.avg_entry_price,
                currentPrice: position.current_price,
                profit_loss: position.unrealized_pl
            });

            // 8. Place a test sell order
            const sellOrder = await alpacaService.executeOrder({
                symbol: 'BTCUSD',
                quantity: position.qty,
                side: 'sell',
                type: 'market'
            });
            logger.info('Sell order placed:', {
                id: sellOrder.id,
                symbol: sellOrder.symbol,
                quantity: sellOrder.qty,
                side: sellOrder.side,
                type: sellOrder.type,
                status: sellOrder.status
            });
        } else {
            logger.info('Order not filled, checking open orders...');
            
            // Cancel open order if it exists
            if (orderStatus.status === 'new' || orderStatus.status === 'partially_filled') {
                await alpacaService.cancelOrder(buyOrder.id);
                logger.info('Cancelled unfilled order:', buyOrder.id);
            }

            // List all open orders
            const openOrders = await alpacaService.alpaca.getOrders({
                status: 'open'
            });
            logger.info('Open orders:', openOrders);
        }

        // 9. Final account check
        const finalAccount = await alpacaService.getAccountInfo();
        logger.info('Final Account Status:', {
            equity: finalAccount.equity,
            buyingPower: finalAccount.buying_power,
            cash: finalAccount.cash
        });

        logger.info('Paper trading test completed successfully');
    } catch (error) {
        logger.error('Paper trading test failed:', error);
        
        // Additional error details
        if (error.response) {
            logger.error('Error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
    } finally {
        // Cleanup
        alpacaService.cleanup();
    }
}

// Run the test if called directly
if (require.main === module) {
    testPaperTrading().catch(console.error);
}

module.exports = testPaperTrading;
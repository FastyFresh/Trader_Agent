const socketIo = require('socket.io');
const logger = require('../utils/logger');

let io;

function setupSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        logger.info('New client connected');

        socket.on('subscribe_market', (symbol) => {
            logger.info(`Client subscribed to market: ${symbol}`);
            socket.join(`market:${symbol}`);
        });

        socket.on('unsubscribe_market', (symbol) => {
            logger.info(`Client unsubscribed from market: ${symbol}`);
            socket.leave(`market:${symbol}`);
        });

        socket.on('disconnect', () => {
            logger.info('Client disconnected');
        });
    });

    return io;
}

function emitMarketUpdate(symbol, data) {
    if (io) {
        io.to(`market:${symbol}`).emit('market_update', {
            symbol,
            timestamp: new Date(),
            data
        });
    }
}

function emitTradeSignal(symbol, signal) {
    if (io) {
        io.to(`market:${symbol}`).emit('trade_signal', {
            symbol,
            timestamp: new Date(),
            signal
        });
    }
}

function emitPortfolioUpdate(data) {
    if (io) {
        io.emit('portfolio_update', {
            timestamp: new Date(),
            data
        });
    }
}

module.exports = {
    setupSocket,
    emitMarketUpdate,
    emitTradeSignal,
    emitPortfolioUpdate
};
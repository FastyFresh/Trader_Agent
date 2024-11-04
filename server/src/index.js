require('dotenv').config();
const { Server } = require('ws');
const { startServer } = require('./server');

const PORT = process.env.PORT || 3000;

startServer(PORT).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
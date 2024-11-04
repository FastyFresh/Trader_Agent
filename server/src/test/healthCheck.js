const express = require('express');
const app = express();
const WebSocket = require('ws');

async function testServerHealth() {
    try {
        // Test REST API
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();
        console.log('REST API Health Check:', data);

        // Test WebSocket
        const ws = new WebSocket('ws://localhost:3000');
        
        ws.on('open', () => {
            console.log('WebSocket Connection Successful');
            
            // Send test message
            ws.send(JSON.stringify({
                type: 'subscribe',
                data: { symbol: 'SOL-PERP' }
            }));
        });

        ws.on('message', (data) => {
            console.log('Received WebSocket Data:', JSON.parse(data));
        });

        ws.on('error', (error) => {
            console.error('WebSocket Error:', error);
        });

        // Wait 5 seconds then close
        setTimeout(() => {
            ws.close();
            console.log('WebSocket Connection Closed');
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error('Health Check Failed:', error);
        process.exit(1);
    }
}

testServerHealth();
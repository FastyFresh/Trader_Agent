# Trader Agent

An autonomous trading agent for cryptocurrency trading using Solana and Drift Protocol.

## Recent Updates

- Configured Solana wallet authentication
- Implemented simulated trading mode
- Added market data service
- Enhanced WebSocket connections
- Improved error handling

## Setup

1. Clone the repository:
```bash
git clone https://github.com/FastyFresh/Trader_Agent.git
cd Trader_Agent
```

2. Install dependencies:
```bash
cd server && npm install
cd ../client && npm install
```

3. Generate Solana Wallet:
```bash
solana-keygen new
```

4. Configure environment variables:
```bash
# server/.env
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
ANCHOR_WALLET=/path/to/your/solana/wallet.json
```

5. Start development servers:
```bash
# In one terminal
cd client && npm run dev

# In another terminal
cd server && npm run dev
```

## Features

- Real-time market data streaming
- Automated trading strategies
- Risk management system
- Performance tracking
- WebSocket-based updates

## Testing

Use simulated mode for testing by setting:
```
USE_SIMULATED_DATA=true
```

## Production

For live trading:
1. Fund your Solana wallet
2. Set USE_SIMULATED_DATA=false
3. Configure proper RPC endpoints

## License

[MIT License](LICENSE)

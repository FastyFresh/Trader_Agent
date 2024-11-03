# Trader Agent - Automated Crypto Trading Bot

An automated trading system that aims to grow $100 to $1M using the Drift Protocol on Solana.

## Development Setup

### Prerequisites
- Node.js v16+
- NPM or Yarn
- Phantom Wallet Browser Extension

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/FastyFresh/Trader_Agent.git
cd Trader_Agent
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure development environment:
```bash
# Copy environment files
cp server/.env.development server/.env
cp client/.env.development client/.env
```

### Devnet Testing

1. **Setup Phantom Wallet for Devnet**:
   - Open Phantom Wallet
   - Click Settings (gear icon)
   - Select "Developer Settings"
   - Choose "Solana Devnet"

2. **Get Devnet SOL** (Multiple Options):

   a) **Using QuickNode Faucet**:
   - Visit [QuickNode Faucet](https://quicknode.com/faucet/sol)
   - Enter your wallet address
   - Request SOL (supports larger amounts)

   b) **Using Helius Faucet**:
   - Visit [Helius](https://www.helius.dev/)
   - Create free account
   - Use their faucet feature

   c) **Using Discord Faucets**:
   - Join "The 76 Devs" or "LamportDAO" Discord
   - Use their faucet bots
   - Request devnet SOL

   d) **Using CLI** (if other methods fail):
   ```bash
   solana config set --url https://api.devnet.solana.com
   solana airdrop 2 YOUR_WALLET_ADDRESS
   ```

   You need 2 SOL minimum for testing (simulates $125 requirement)

3. **Start the Development Servers**:
```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

4. **Access the Application**:
   - Open browser to http://localhost:5173
   - Connect your Phantom wallet
   - Click "Start Trading Bot"

### Testing Features

1. **Wallet Connection**:
   - Click "Connect Wallet" button
   - Approve connection in Phantom
   - System will check for 2 SOL minimum balance

2. **Trading Bot**:
   - Initial Phase uses aggressive momentum strategy
   - Grid trading activates at higher balances
   - Real-time updates in dashboard
   - Automatic strategy adjustments

3. **Monitoring**:
   - View portfolio value
   - Track active trades
   - Monitor risk metrics
   - Check strategy performance

### Development Notes

- All trades are simulated in development mode
- Price data uses realistic market simulation
- Wallet transactions use devnet
- Real-time updates every 5 seconds

### Troubleshooting

1. **Wallet Connection Issues**:
   - Ensure Phantom is set to Devnet
   - Check wallet has sufficient SOL
   - Clear browser cache if needed

2. **Server Connection Issues**:
   - Verify both servers are running
   - Check console for error messages
   - Ensure ports 3000 and 5173 are free

3. **Trading Issues**:
   - Check server logs for details
   - Verify Drift Protocol connection
   - Ensure wallet has approved transactions

4. **SOL Airdrop Issues**:
   If you get "airdrop limit reached" or other errors:
   - Try different faucets listed above
   - Wait a few hours between attempts
   - Use multiple faucets to accumulate required amount
   - Join Discord communities for additional help

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT

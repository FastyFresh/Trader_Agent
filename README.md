# Trader Agent - AI Cryptocurrency Trading System

A sophisticated AI-powered cryptocurrency trading system designed to achieve $1,000,000 in equity from a $500 initial investment over 3-5 years using machine learning and multi-agent architecture.

## System Architecture

### Trading Components
- Multiple AI trading agents for different strategies
- Real-time market data processing
- ML-based signal generation
- Advanced risk management
- Portfolio optimization
- Performance analytics
- Historical backtesting

### Technology Stack
- **Backend:**
  - Node.js/Express
  - MongoDB for data persistence
  - TensorFlow.js for ML models
  - WebSocket for real-time updates
  - Alpaca API for trading
  
- **Frontend:**
  - React with TypeScript
  - TailwindCSS for styling
  - Chart.js for data visualization
  - Real-time WebSocket integration

### Features

1. **Multi-Agent Trading System**
   - TrendFollowing strategy
   - MeanReversion strategy
   - ML-enhanced decision making
   - Automated trade execution

2. **Risk Management**
   - Position sizing
   - Stop-loss management
   - Portfolio exposure control
   - Drawdown protection

3. **Real-Time Analytics**
   - Portfolio performance tracking
   - Trade history analysis
   - Risk metrics monitoring
   - Strategy performance evaluation

4. **Professional Dashboard**
   - Real-time market data
   - Portfolio overview
   - Active trades monitoring
   - Performance charts
   - Strategy controls

## Setup and Installation

1. Prerequisites:
   ```bash
   # Install MongoDB
   docker pull mongo
   docker run -d -p 27017:27017 --name trader-agent-mongo mongo
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/FastyFresh/Trader_Agent.git
   cd Trader_Agent
   ```

3. Install dependencies:
   ```bash
   # Backend
   cd server
   npm install
   
   # Frontend
   cd ../client
   npm install
   ```

4. Set up environment variables:
   Create `.env` file in the server directory with:
   ```
   ALPACA_API_KEY=your_key
   ALPACA_API_SECRET=your_secret
   MONGODB_URI=mongodb://localhost:27017/trader_agent
   ```

5. Start the application:
   ```bash
   # Start backend (from server directory)
   npm run dev
   
   # Start frontend (from client directory)
   npm run dev
   ```

6. Access the application:
   - Frontend: http://localhost:5176
   - Backend API: http://localhost:3000
   - WebSocket: ws://localhost:3000

## API Endpoints

### Trading Operations
- `GET /api/trading/portfolio` - Get portfolio overview
- `GET /api/trading/performance` - Get performance metrics
- `GET /api/trading/active-trades` - List active trades
- `POST /api/trading/execute-trade` - Execute a trade

### Strategy Management
- `GET /api/strategies` - List available strategies
- `POST /api/strategies/:name/start` - Start a strategy
- `POST /api/strategies/:name/stop` - Stop a strategy
- `GET /api/strategies/:name/performance` - Get strategy performance

### Analytics
- `GET /api/analytics/portfolio/history` - Get portfolio history
- `GET /api/analytics/trade/performance` - Get trade performance
- `GET /api/analytics/risk/metrics` - Get risk metrics

## Development Status

- [x] Basic trading infrastructure
- [x] Database integration
- [x] Real-time market data
- [x] Trading strategies implementation
- [x] Risk management system
- [x] Frontend dashboard
- [ ] Advanced ML models
- [ ] Strategy optimization
- [ ] Portfolio rebalancing
- [ ] Extended backtesting

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

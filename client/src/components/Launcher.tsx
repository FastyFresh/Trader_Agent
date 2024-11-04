import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

interface TradingStats {
  accountBalance: number;
  equity: number;
  totalPnL: number;
  pnL24h: number;
  pnL7d: number;
  winRate: number;
  totalTrades: number;
  accountHealth: number;
  availableMargin: number;
  currentGoal: number;
  progressToGoal: number;
}

const initialStats: TradingStats = {
  accountBalance: 0,
  equity: 0,
  totalPnL: 0,
  pnL24h: 0,
  pnL7d: 0,
  winRate: 0,
  totalTrades: 0,
  accountHealth: 0,
  availableMargin: 0,
  currentGoal: 0,
  progressToGoal: 0
};

const tradingParameters = {
  maxPositionSize: 1000,
  maxLeverage: 3,
  riskPerTrade: 1,
  stopLoss: 2
};

const targetGoal = 1000000;

const Launcher = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stats, setStats] = useState<TradingStats>(initialStats);

  const handleConnect = async () => {
    try {
      // Check if Phantom is available
      const { solana } = window as any;

      if (!solana?.isPhantom) {
        throw new Error('Phantom wallet not found! Get it from https://phantom.app/');
      }

      // Connect to Phantom
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value / 100);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-900 min-h-screen text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Trader Agent</h1>
            <p className="text-gray-400">Beta</p>
          </div>

          {!isConnected ? (
            <div className="max-w-md mx-auto text-center">
              <button
                onClick={handleConnect}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition duration-200"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="text-green-400 font-semibold mb-4">System Online</div>
                  <div className="text-gray-300 mb-4">
                    Connected: {walletAddress && formatAddress(walletAddress)}
                  </div>
                  <div className="text-2xl font-bold mb-4">{formatCurrency(targetGoal)}</div>
                  <div className="text-gray-400 mb-6">Target Goal</div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>SOL-PERP</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Trading Market</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span>24/7</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Progress to Goal</h2>
                  <div className="mb-2">Goal: {formatCurrency(targetGoal)}</div>
                  <div className="mb-2">Current: {formatCurrency(stats.currentGoal)}</div>
                  <div>{formatPercent(stats.progressToGoal)}</div>
                </div>
              </div>

              {/* Middle Column */}
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Automated Trading</h3>
                    <p className="text-gray-400">Smart Risk Management Active</p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Trading Bot</h3>
                    <p className="text-gray-400">Automated trading on Drift Protocol</p>
                  </div>

                  <button
                    className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    Start Trading
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Trading Strategy</h2>
                  <ul className="space-y-2 text-gray-300">
                    <li>Momentum Strategy on SOL-PERP</li>
                    <li>Dynamic Grid Based on Volatility</li>
                    <li>Automatic Risk Management</li>
                  </ul>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Trading Parameters</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Max Position Size</span>
                      <span>{formatCurrency(tradingParameters.maxPositionSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Leverage</span>
                      <span>{tradingParameters.maxLeverage}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk per Trade</span>
                      <span>{tradingParameters.riskPerTrade}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop Loss</span>
                      <span>{tradingParameters.stopLoss}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
                  <p className="text-sm text-gray-400 mb-4">Updated every 5s</p>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2">Account Balance</h3>
                      <div className="text-2xl font-bold mb-2">{formatCurrency(stats.accountBalance)}</div>
                      <div className="text-gray-400">Equity: {formatCurrency(stats.equity)}</div>
                    </div>

                    <div>
                      <h3 className="mb-2">Total P&L</h3>
                      <div className="text-2xl font-bold mb-2">{formatCurrency(stats.totalPnL)}</div>
                      <div className="text-gray-400">
                        24h: {formatCurrency(stats.pnL24h)}
                        <br />
                        7d: {formatCurrency(stats.pnL7d)}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2">Win Rate</h3>
                      <div className="text-2xl font-bold mb-2">{stats.winRate}%</div>
                      <div className="text-gray-400">From {stats.totalTrades} total trades</div>
                    </div>

                    <div>
                      <h3 className="mb-2">Account Health</h3>
                      <div className="text-2xl font-bold mb-2">{stats.accountHealth}%</div>
                      <div className="text-gray-400">Available margin: {formatCurrency(stats.availableMargin)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Launcher;
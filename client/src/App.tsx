import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import WalletConnect from './components/WalletConnect';
import TraderControls from './components/TraderControls';
import PortfolioStats from './components/PortfolioStats';

const App = () => {
  const [connected, setConnected] = useState(false);

  const handleConnect = (publicKey: string) => {
    console.log('Wallet connected:', publicKey);
    setConnected(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-8 py-6">
      <Toaster position="top-right" />
      
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trader Agent</h1>
          <p className="text-gray-400">Automated Trading on Drift Protocol</p>
        </div>
        <WalletConnect onConnect={handleConnect} />
      </header>

      <main className="max-w-6xl mx-auto">
        {connected ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-gray-400 text-sm mb-2">Target Goal</h3>
                <div className="text-2xl font-bold">$1,000,000</div>
                <div className="text-xs text-gray-500 mt-1">Through Smart Trading</div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-gray-400 text-sm mb-2">Trading Market</h3>
                <div className="text-2xl font-bold">SOL-PERP</div>
                <div className="text-xs text-gray-500 mt-1">On Drift Protocol</div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-gray-400 text-sm mb-2">Initial Phase</h3>
                <div className="text-2xl font-bold">$100-$1,000</div>
                <div className="text-xs text-gray-500 mt-1">Momentum Trading</div>
              </div>
            </div>

            <PortfolioStats />
            <TraderControls />
            
            <div className="mt-8 p-6 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="text-blue-400 text-lg font-semibold mb-2">1. Connect & Fund</div>
                  <p className="text-gray-400 text-sm">
                    Connect your Phantom wallet with a minimum balance of $125 to begin automated trading.
                  </p>
                </div>
                
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="text-green-400 text-lg font-semibold mb-2">2. Start Trading</div>
                  <p className="text-gray-400 text-sm">
                    The bot uses momentum and grid strategies to trade SOL-PERP on your behalf 24/7.
                  </p>
                </div>
                
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="text-purple-400 text-lg font-semibold mb-2">3. Monitor Growth</div>
                  <p className="text-gray-400 text-sm">
                    Track your portfolio's performance with real-time statistics and progress updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Risk Management</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-400">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-400">
                      Dynamic position sizing based on account equity
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-400">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-400">
                      Automatic stop-loss and take-profit orders
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-green-400">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-400">
                      Maximum 3x leverage to manage risk exposure
                    </p>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Trading Strategy</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-400">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-400">
                      Momentum trading based on price action and volume
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-400">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-400">
                      Dynamic grid trading adapts to market volatility
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-400">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-400">
                      Smart order routing for best execution price
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center bg-gray-800 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold">Welcome to Trader Agent</h2>
            <p className="text-gray-400">
              Connect your Phantom wallet with a minimum balance of $125 to start automated trading on Drift Protocol. Our strategies aim to grow your portfolio from $100 to $1,000,000 through smart, risk-managed trades.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-400">24/7 Trading</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-400">Smart Risk Management</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="ml-2 text-sm text-gray-400">Real-time Monitoring</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

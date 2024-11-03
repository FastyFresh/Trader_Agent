import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import WalletConnect from './components/WalletConnect';
import Trading from './components/Trading';
import PortfolioStats from './components/PortfolioStats';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const App = () => {
  const [connected, setConnected] = useState(false);

  const handleConnect = (publicKey: string) => {
    console.log('Wallet connected:', publicKey);
    setConnected(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-right" />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1">
          <Header onConnect={handleConnect} />
          
          <main className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {connected ? (
                <>
                  <PortfolioStats />
                  <Trading />
                </>
              ) : (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">
                    Welcome to Trader Agent
                  </h2>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Connect your Phantom wallet with a minimum balance of $125 to start automated trading on Drift Protocol. Our AI-powered strategies aim to grow your portfolio through smart, risk-managed trades.
                  </p>
                  <WalletConnect onConnect={handleConnect} />
                </div>
              )}

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">
                  About Trader Agent
                </h3>
                <p className="text-gray-400 mb-4">
                  Trader Agent is an automated trading system that uses advanced algorithms to trade on the Solana Drift Protocol. Our goal is to help you grow your portfolio through:
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">24/7 Trading</h4>
                    <p className="text-sm text-gray-400">
                      Continuous market monitoring and automated execution
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Risk Management</h4>
                    <p className="text-sm text-gray-400">
                      Dynamic position sizing and stop-loss implementation
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Smart Strategies</h4>
                    <p className="text-sm text-gray-400">
                      Grid and momentum trading optimized for Drift Protocol
                    </p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Performance Tracking</h4>
                    <p className="text-sm text-gray-400">
                      Real-time monitoring of trades, P&L, and portfolio stats
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;

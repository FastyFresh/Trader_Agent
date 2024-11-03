import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import WalletConnect from './components/WalletConnect';
import TraderControls from './components/TraderControls';
import PortfolioStats from './components/PortfolioStats';
import PerformanceChart from './components/PerformanceChart';
import './styles/index.css';

const App = () => {
  const [connected, setConnected] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');

  const handleConnect = (publicKey: string) => {
    console.log('Wallet connected:', publicKey);
    setConnected(true);
  };

  return (
    <div className="AppLayout">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="Heading1">Trader Agent</h1>
            <span className="Badge Badge-info">Beta</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="StatusDot StatusDot-online"></div>
              <span className="Text-small">System Online</span>
            </div>
            <WalletConnect onConnect={handleConnect} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="MainContent pt-24">
        {connected ? (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="StatsGrid">
              <div className="StatCard">
                <div className="StatValue">$1,000,000</div>
                <div className="StatLabel">Target Goal</div>
              </div>
              <div className="StatCard">
                <div className="StatValue">SOL-PERP</div>
                <div className="StatLabel">Trading Market</div>
              </div>
              <div className="StatCard">
                <div className="StatValue">24/7</div>
                <div className="StatLabel">Automated Trading</div>
              </div>
              <div className="StatCard">
                <div className="StatValue">Smart Risk</div>
                <div className="StatLabel">Management Active</div>
              </div>
            </div>

            {/* Main Sections */}
            <div className="ControlsGrid">
              <TraderControls />
              <PortfolioStats />
            </div>

            {/* Performance Chart */}
            <PerformanceChart />

            {/* Info Section */}
            <div className="Card p-6">
              <h2 className="Heading2 mb-4">Trading Strategy</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="Heading3 mb-3">Risk Management</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="StatusDot StatusDot-online"></div>
                      <span>Dynamic position sizing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="StatusDot StatusDot-online"></div>
                      <span>Automatic stop-loss</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="StatusDot StatusDot-online"></div>
                      <span>Maximum 3x leverage</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="Heading3 mb-3">Grid Strategy</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="StatusDot StatusDot-online"></div>
                      <span>Momentum-based trading</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="StatusDot StatusDot-online"></div>
                      <span>Dynamic grid placement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="StatusDot StatusDot-online"></div>
                      <span>Volatility adaptation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="Card p-8 max-w-xl w-full text-center">
              <h2 className="Heading1 mb-4">Welcome to Trader Agent</h2>
              <p className="Text-large text-gray-400 mb-6">
                Connect your Phantom wallet with a minimum balance of $125 to start automated trading on Drift Protocol. Our smart strategies aim to grow your portfolio from $100 to $1,000,000.
              </p>
              <div className="flex justify-center mb-8">
                <WalletConnect onConnect={handleConnect} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="Text-large font-semibold mb-2">24/7 Trading</div>
                  <p className="Text-small">Continuous market monitoring</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="Text-large font-semibold mb-2">Smart Risk</div>
                  <p className="Text-small">Dynamic position sizing</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="Text-large font-semibold mb-2">Real-time</div>
                  <p className="Text-small">Live performance tracking</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

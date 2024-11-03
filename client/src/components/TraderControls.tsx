import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useConnection } from '../hooks/useConnection';

const TraderControls = () => {
  const { connected, publicKey } = useConnection();
  const [isRunning, setIsRunning] = useState(false);
  const [balance, setBalance] = useState(0);

  const startTrading = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const balanceResponse = await fetch('http://localhost:3000/api/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: publicKey
        })
      });
      
      const { balance: walletBalance } = await balanceResponse.json();
      setBalance(walletBalance);

      if (walletBalance < 125) {
        toast.error('Minimum balance of $125 required to start trading');
        return;
      }

      const response = await fetch('http://localhost:3000/api/autotrader/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: publicKey
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsRunning(true);
        toast.success('Trading bot started successfully');
      } else {
        toast.error(data.error || 'Failed to start trading bot');
      }
    } catch (error) {
      console.error('Error starting trader:', error);
      toast.error('Failed to connect to trading server');
    }
  };

  const stopTrading = async () => {
    if (!connected) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/autotrader/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: publicKey
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsRunning(false);
        toast.success('Trading bot stopped successfully');
      } else {
        toast.error(data.error || 'Failed to stop trading bot');
      }
    } catch (error) {
      console.error('Error stopping trader:', error);
      toast.error('Failed to connect to trading server');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Trading Bot</h3>
          <p className="text-gray-400 text-sm">
            Automated trading on Drift Protocol
          </p>
        </div>
        
        {connected ? (
          <button
            onClick={isRunning ? stopTrading : startTrading}
            className={`px-6 py-2 rounded-lg font-semibold ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? 'Stop Trading' : 'Start Trading'}
          </button>
        ) : (
          <div className="text-gray-400">
            Connect wallet to start trading
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Trading Strategy
          </h4>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              Momentum Strategy on SOL-PERP
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              Dynamic Grid Based on Volatility
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
              Automatic Risk Management
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-300">
              Progress to Goal
            </h4>
            <div className="text-sm text-gray-400">
              Goal: $1,000,000
            </div>
          </div>
          
          <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${Math.min((balance / 1000000) * 100, 100)}%`
              }}
            ></div>
          </div>
          
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <div>Current: ${balance.toFixed(2)}</div>
            <div>{((balance / 1000000) * 100).toFixed(4)}%</div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Trading Parameters
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Max Position Size</div>
              <div className="font-semibold">$1,000</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Max Leverage</div>
              <div className="font-semibold">3x</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Risk per Trade</div>
              <div className="font-semibold">1%</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Stop Loss</div>
              <div className="font-semibold">2%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraderControls;
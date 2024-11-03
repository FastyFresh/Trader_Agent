import { useState, useEffect } from 'react';
import { useConnection } from '../hooks/useConnection';
import { toast } from 'react-hot-toast';

const Trading = () => {
  const { connected, publicKey } = useConnection();
  const [activeStrategy, setActiveStrategy] = useState<string>('');
  const [tradingActive, setTradingActive] = useState(false);
  const [marketData, setMarketData] = useState({
    price: 0,
    change24h: 0,
    volume24h: 0,
    fundingRate: 0
  });
  const [positions, setPositions] = useState([]);
  const [availableStrategies] = useState([
    { id: 'grid', name: 'Grid Trading', description: 'Places buy and sell orders at regular price intervals' },
    { id: 'momentum', name: 'Momentum Trading', description: 'Follows strong price movements and trends' }
  ]);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'market_update') {
        setMarketData(data.payload);
      } else if (data.type === 'position_update') {
        setPositions(data.payload);
      }
    };

    return () => ws.close();
  }, []);

  const startTrading = async (strategy: string) => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/autotrader/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strategy,
          wallet: publicKey?.toString()
        })
      });

      if (!response.ok) throw new Error('Failed to start trading');

      setActiveStrategy(strategy);
      setTradingActive(true);
      toast.success(`${strategy} trading started successfully`);
    } catch (error) {
      toast.error('Failed to start trading: ' + (error as Error).message);
    }
  };

  const stopTrading = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/autotrader/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: publicKey?.toString()
        })
      });

      if (!response.ok) throw new Error('Failed to stop trading');

      setActiveStrategy('');
      setTradingActive(false);
      toast.success('Trading stopped successfully');
    } catch (error) {
      toast.error('Failed to stop trading: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trading Dashboard</h2>
        {connected ? (
          <div className="flex items-center space-x-4">
            <span className="text-green-400">Connected: {publicKey?.toString().slice(0, 8)}...</span>
            {tradingActive ? (
              <button
                onClick={stopTrading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Stop Trading
              </button>
            ) : null}
          </div>
        ) : (
          <span className="text-red-400">Wallet not connected</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Trading Strategies */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Trading Strategies</h3>
          <div className="space-y-4">
            {availableStrategies.map((strategy) => (
              <div key={strategy.id} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{strategy.name}</span>
                  {activeStrategy === strategy.id ? (
                    <span className="text-green-400">Active</span>
                  ) : (
                    <button
                      onClick={() => startTrading(strategy.id)}
                      disabled={!connected || tradingActive}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-400">{strategy.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market Overview */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">SOL-PERP</span>
              <span className={marketData.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                ${marketData.price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">24h Change</span>
              <span className={marketData.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                {marketData.change24h.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">24h Volume</span>
              <span className="text-white">
                ${(marketData.volume24h / 1000000).toFixed(2)}M
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Funding Rate</span>
              <span className={marketData.fundingRate >= 0 ? "text-blue-400" : "text-red-400"}>
                {marketData.fundingRate.toFixed(4)}%
              </span>
            </div>
          </div>
        </div>

        {/* Active Positions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Active Positions</h3>
          <div className="space-y-4">
            {positions.length === 0 ? (
              <p className="text-gray-400 text-center">No active positions</p>
            ) : (
              positions.map((position: any) => (
                <div key={position.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{position.symbol}</span>
                    <span className={position.side === 'long' ? "text-green-400" : "text-red-400"}>
                      {position.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Size:</span>
                      <span className="ml-2">${position.size.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Entry:</span>
                      <span className="ml-2">${position.entryPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">PnL:</span>
                      <span className={`ml-2 ${position.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        ${position.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">ROE:</span>
                      <span className={`ml-2 ${position.roe >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {position.roe.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
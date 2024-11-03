import { useEffect, useState } from 'react';
import { useConnection } from '../hooks/useConnection';

interface Stats {
  pnl: number;
  trades: number;
  winRate: number;
  dailyPnL: number;
  weeklyPnL: number;
  balance: number;
  equity: number;
}

const PortfolioStats = () => {
  const { connected } = useConnection();
  const [stats, setStats] = useState<Stats>({
    pnl: 0,
    trades: 0,
    winRate: 0,
    dailyPnL: 0,
    weeklyPnL: 0,
    balance: 0,
    equity: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!connected) return;
      
      try {
        const response = await fetch('http://localhost:3000/api/autotrader/status');
        const data = await response.json();
        
        if (data.performance) {
          setStats({
            pnl: data.performance.totalPnL || 0,
            trades: data.performance.trades || 0,
            winRate: data.performance.winRate || 0,
            dailyPnL: data.performance.dailyPnL || 0,
            weeklyPnL: data.performance.weeklyPnL || 0,
            balance: data.account.balance || 0,
            equity: data.account.equity || 0
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds
    fetchStats(); // Initial fetch

    return () => clearInterval(interval);
  }, [connected]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Portfolio Performance</h3>
        <div className="text-sm text-gray-400">
          Updated every 5s
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Account Balance</p>
          <p className="text-xl font-semibold">
            ${stats.balance.toFixed(2)}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Equity: ${stats.equity.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total P&L</p>
          <p className={`text-xl font-semibold ${stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.pnl.toFixed(2)}
          </p>
          <div className="flex justify-between text-sm mt-2">
            <span className={stats.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
              24h: ${stats.dailyPnL.toFixed(2)}
            </span>
            <span className={stats.weeklyPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
              7d: ${stats.weeklyPnL.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Win Rate</p>
          <p className="text-xl font-semibold">
            {(stats.winRate * 100).toFixed(1)}%
          </p>
          <p className="text-gray-400 text-sm mt-2">
            From {stats.trades} total trades
          </p>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Account Health</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 rounded-full h-2"
                style={{
                  width: `${Math.min((stats.equity / stats.balance) * 100, 100)}%`
                }}
              />
            </div>
            <span className="text-sm">
              {((stats.equity / stats.balance) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Available margin: ${(stats.balance - stats.equity).toFixed(2)}
          </p>
        </div>
      </div>

      {!connected && (
        <div className="text-center text-gray-400 py-4">
          Connect your wallet to view portfolio stats
        </div>
      )}
    </div>
  );
};

export default PortfolioStats;
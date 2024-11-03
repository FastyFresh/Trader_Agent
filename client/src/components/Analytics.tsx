const Analytics = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total P&L</h3>
          <div className="text-2xl font-bold text-green-400">+$12,450.00</div>
          <div className="text-sm text-gray-400 mt-1">+15.2% this month</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Win Rate</h3>
          <div className="text-2xl font-bold text-white">65%</div>
          <div className="text-sm text-gray-400 mt-1">+5% vs last month</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Avg Trade Duration</h3>
          <div className="text-2xl font-bold text-white">4h 23m</div>
          <div className="text-sm text-gray-400 mt-1">-12% vs last month</div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Trades</h3>
          <div className="text-2xl font-bold text-white">342</div>
          <div className="text-sm text-gray-400 mt-1">Last 30 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Performance by Asset</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-20 text-gray-400">BTC/USD</div>
              <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="w-20 text-right text-green-400">+$8,240</div>
            </div>
            <div className="flex items-center">
              <div className="w-20 text-gray-400">ETH/USD</div>
              <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <div className="w-20 text-right text-green-400">+$3,120</div>
            </div>
            <div className="flex items-center">
              <div className="w-20 text-gray-400">SOL/USD</div>
              <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <div className="w-20 text-right text-red-400">-$890</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <div>
                <div className="font-medium">BTC/USD Long</div>
                <div className="text-sm text-gray-400">2h ago</div>
              </div>
              <div className="text-right">
                <div className="text-green-400">+$450</div>
                <div className="text-sm text-gray-400">+2.3%</div>
              </div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-700">
              <div>
                <div className="font-medium">ETH/USD Short</div>
                <div className="text-sm text-gray-400">5h ago</div>
              </div>
              <div className="text-right">
                <div className="text-red-400">-$120</div>
                <div className="text-sm text-gray-400">-0.8%</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">SOL/USD Long</div>
                <div className="text-sm text-gray-400">8h ago</div>
              </div>
              <div className="text-right">
                <div className="text-green-400">+$280</div>
                <div className="text-sm text-gray-400">+1.5%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
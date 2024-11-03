const Performance = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Return</h3>
          <div className="text-2xl font-bold text-green-400">+32.5%</div>
          <div className="text-sm text-gray-400 mt-1">Since inception</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Sharpe Ratio</h3>
          <div className="text-2xl font-bold text-white">2.1</div>
          <div className="text-sm text-gray-400 mt-1">30-day average</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Max Drawdown</h3>
          <div className="text-2xl font-bold text-red-400">-12.4%</div>
          <div className="text-sm text-gray-400 mt-1">Historical max</div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Profit Factor</h3>
          <div className="text-2xl font-bold text-white">1.8</div>
          <div className="text-sm text-gray-400 mt-1">Gross profit/loss ratio</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Monthly Returns</h3>
          <div className="grid grid-cols-4 gap-2">
            {[12, 8, -5, 15, 7, -3, 9, 11].map((return_, index) => (
              <div key={index} className="text-center">
                <div className={`h-24 relative bg-gray-700 rounded-lg overflow-hidden`}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${
                      return_ > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${Math.abs(return_ * 3)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-400 mt-1">M{index + 1}</div>
                <div className={`text-sm ${return_ > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {return_ > 0 ? '+' : ''}{return_}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Strategy Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Trend Following</span>
                <span className="text-green-400">+24.5%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Mean Reversion</span>
                <span className="text-green-400">+18.2%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Momentum</span>
                <span className="text-red-400">-5.8%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Performance Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Win Rate</div>
                <div className="font-medium">65.2%</div>
              </div>
              <div>
                <div className="text-gray-400">Average Win</div>
                <div className="font-medium text-green-400">+2.3%</div>
              </div>
              <div>
                <div className="text-gray-400">Loss Rate</div>
                <div className="font-medium">34.8%</div>
              </div>
              <div>
                <div className="text-gray-400">Average Loss</div>
                <div className="font-medium text-red-400">-1.1%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
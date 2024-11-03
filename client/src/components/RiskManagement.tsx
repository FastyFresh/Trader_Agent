const RiskManagement = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Risk Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Position Limits</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max Position Size (USD)
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max Open Positions
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Max Leverage
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
            >
              Update Limits
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Stop Loss Settings</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Default Stop Loss (%)
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Trailing Stop Loss (%)
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2"
              />
            </div>
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="autoStopLoss"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
              />
              <label htmlFor="autoStopLoss" className="ml-2 text-sm text-gray-400">
                Enable Automatic Stop Loss
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
            >
              Save Settings
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Risk Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Portfolio Heat</div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="text-sm text-gray-400 mt-1">45% of max risk</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Leverage Used</div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <div className="text-sm text-gray-400 mt-1">3x of 10x max</div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-400 mb-1">Position Diversification</div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <div className="text-sm text-gray-400 mt-1">3 assets of 5 max</div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Risk Alerts</div>
              <div className="space-y-2">
                <div className="flex items-center text-yellow-400">
                  <span className="h-2 w-2 rounded-full bg-yellow-400 mr-2"></span>
                  <span className="text-sm">High concentration in BTC/USD</span>
                </div>
                <div className="flex items-center text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                  <span className="text-sm">Stop losses set for all positions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;
const Trading = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Trading</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">New Trade</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Market
              </label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>BTC/USD</option>
                <option>ETH/USD</option>
                <option>SOL/USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Side
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  className="flex-1 bg-green-600/20 text-green-400 border border-green-600/20 rounded-lg px-4 py-2 hover:bg-green-600/30"
                >
                  Long
                </button>
                <button
                  type="button"
                  className="flex-1 bg-red-600/20 text-red-400 border border-red-600/20 rounded-lg px-4 py-2 hover:bg-red-600/30"
                >
                  Short
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Size (USD)
              </label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Leverage
              </label>
              <input
                type="range"
                min="1"
                max="20"
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400 mt-1">
                <span>1x</span>
                <span>20x</span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
            >
              Place Trade
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">BTC/USD</span>
              <span className="text-green-400">$43,250.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">24h Change</span>
              <span className="text-green-400">+2.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">24h Volume</span>
              <span className="text-white">$1.2B</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Funding Rate</span>
              <span className="text-blue-400">0.01%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Active Positions</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">BTC/USD</span>
                <span className="text-green-400">Long</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Size:</span>
                  <span className="ml-2">$10,000</span>
                </div>
                <div>
                  <span className="text-gray-400">Entry:</span>
                  <span className="ml-2">$42,800</span>
                </div>
                <div>
                  <span className="text-gray-400">PnL:</span>
                  <span className="ml-2 text-green-400">+$450</span>
                </div>
                <div>
                  <span className="text-gray-400">ROE:</span>
                  <span className="ml-2 text-green-400">+4.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trading;
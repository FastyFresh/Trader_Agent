import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Play, Pause, Settings, TrendingUp } from 'lucide-react'

interface Strategy {
  id: string
  name: string
  status: 'active' | 'paused'
  performance: {
    winRate: number
    pnl: number
  }
  risk: {
    drawdown: number
    sharpe: number
  }
}

const StrategyManager = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)

  const { data: strategies, isLoading } = useQuery<Strategy[]>({
    queryKey: ['strategies'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/trading/strategies')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="card">Loading strategies...</div>
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Strategy Manager</h2>
        <button className="btn-secondary text-sm">Add Strategy</button>
      </div>

      <div className="space-y-4">
        {strategies?.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 bg-gray-800 rounded-lg border ${
              selectedStrategy === strategy.id ? 'border-green-500' : 'border-gray-700'
            } hover:border-green-500 transition-colors cursor-pointer`}
            onClick={() => setSelectedStrategy(strategy.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} className="text-gray-400" />
                <h3 className="font-medium">{strategy.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 rounded hover:bg-gray-700">
                  <Settings size={16} className="text-gray-400" />
                </button>
                <button className="p-1 rounded hover:bg-gray-700">
                  {strategy.status === 'active' ? (
                    <Pause size={16} className="text-green-400" />
                  ) : (
                    <Play size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-400">Win Rate</p>
                <p className="text-sm font-medium text-green-400">
                  {formatPercent(strategy.performance.winRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">P&L</p>
                <p className={`text-sm font-medium ${
                  strategy.performance.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(strategy.performance.pnl)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Max Drawdown</p>
                <p className="text-sm font-medium text-gray-300">
                  {formatPercent(strategy.risk.drawdown)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sharpe Ratio</p>
                <p className="text-sm font-medium text-gray-300">
                  {strategy.risk.sharpe.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Status</span>
                <span className={`px-2 py-1 rounded-full ${
                  strategy.status === 'active'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {strategy.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StrategyManager
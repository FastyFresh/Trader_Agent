import { Shield, AlertTriangle, TrendingUp } from 'lucide-react'

interface RiskData {
  maxDrawdown: number
  sharpeRatio: number
  volatility: number
  valueAtRisk: number
  exposure: {
    total: number
    byAsset: Record<string, number>
  }
}

interface RiskMetricsProps {
  data: {
    riskMetrics: RiskData
  }
}

const RiskMetrics = ({ data }: RiskMetricsProps) => {
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  }

  const getRiskLevel = (value: number, metric: string) => {
    switch (metric) {
      case 'drawdown':
        return value > 10 ? 'high' : value > 5 ? 'medium' : 'low'
      case 'sharpe':
        return value > 2 ? 'low' : value > 1 ? 'medium' : 'high'
      case 'volatility':
        return value > 20 ? 'high' : value > 10 ? 'medium' : 'low'
      default:
        return 'medium'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Risk Metrics</h2>
        <Shield className="text-gray-400" size={20} />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Max Drawdown</p>
                <p className={`stat-value ${getRiskColor(getRiskLevel(data.riskMetrics.maxDrawdown, 'drawdown'))}`}>
                  {formatPercent(data.riskMetrics.maxDrawdown)}
                </p>
              </div>
              <AlertTriangle className={getRiskColor(getRiskLevel(data.riskMetrics.maxDrawdown, 'drawdown'))} size={20} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Sharpe Ratio</p>
                <p className={`stat-value ${getRiskColor(getRiskLevel(data.riskMetrics.sharpeRatio, 'sharpe'))}`}>
                  {data.riskMetrics.sharpeRatio.toFixed(2)}
                </p>
              </div>
              <TrendingUp className={getRiskColor(getRiskLevel(data.riskMetrics.sharpeRatio, 'sharpe'))} size={20} />
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Exposure by Asset</h3>
          <div className="space-y-2">
            {Object.entries(data.riskMetrics.exposure.byAsset).map(([asset, percentage]) => (
              <div key={asset} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{asset}</span>
                <span className="text-gray-400">{formatPercent(percentage)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Total Exposure</span>
            <span className={`font-medium ${
              data.riskMetrics.exposure.total > 80 ? 'text-red-400' :
              data.riskMetrics.exposure.total > 50 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {formatPercent(data.riskMetrics.exposure.total)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-full rounded-full ${
                data.riskMetrics.exposure.total > 80 ? 'bg-red-500' :
                data.riskMetrics.exposure.total > 50 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${data.riskMetrics.exposure.total}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskMetrics
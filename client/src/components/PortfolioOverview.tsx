import { ArrowUpRight, ArrowDownRight, DollarSign, Percent } from 'lucide-react'

interface PortfolioData {
  totalEquity: number
  cashBalance: number
  todayReturn: number
  totalReturn: number
}

interface PortfolioOverviewProps {
  data: PortfolioData
}

const PortfolioOverview = ({ data }: PortfolioOverviewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Portfolio Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Equity</p>
              <p className="stat-value">{formatCurrency(data.totalEquity)}</p>
            </div>
            <DollarSign className="text-gray-400" size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Cash Balance</p>
              <p className="stat-value">{formatCurrency(data.cashBalance)}</p>
            </div>
            <DollarSign className="text-gray-400" size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Today's Return</p>
              <div className="flex items-center">
                <p className={`stat-value ${data.todayReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(data.todayReturn)}
                </p>
                {data.todayReturn >= 0 ? (
                  <ArrowUpRight className="ml-1 text-green-400" size={20} />
                ) : (
                  <ArrowDownRight className="ml-1 text-red-400" size={20} />
                )}
              </div>
            </div>
            <Percent className="text-gray-400" size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Return</p>
              <div className="flex items-center">
                <p className={`stat-value ${data.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(data.totalReturn)}
                </p>
                {data.totalReturn >= 0 ? (
                  <ArrowUpRight className="ml-1 text-green-400" size={20} />
                ) : (
                  <ArrowDownRight className="ml-1 text-red-400" size={20} />
                )}
              </div>
            </div>
            <Percent className="text-gray-400" size={20} />
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Progress to $1,000,000 Goal</span>
          <span>{formatPercent((data.totalEquity / 1000000) * 100)}</span>
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded-full">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${(data.totalEquity / 1000000) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioOverview
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  strategy: string
  timestamp: string
}

const ActiveTrades = () => {
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ['activeTrades'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/trading/active-trades')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="card">Loading trades...</div>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Active Trades</h2>
        <button className="btn-secondary text-sm">View All</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="table-header px-6 py-3">Symbol</th>
              <th className="table-header px-6 py-3">Type</th>
              <th className="table-header px-6 py-3">Quantity</th>
              <th className="table-header px-6 py-3">Entry Price</th>
              <th className="table-header px-6 py-3">Current Price</th>
              <th className="table-header px-6 py-3">P&L</th>
              <th className="table-header px-6 py-3">Strategy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {trades?.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-800">
                <td className="table-cell font-medium">{trade.symbol}</td>
                <td className="table-cell">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                  >
                    {trade.type}
                  </span>
                </td>
                <td className="table-cell">{trade.quantity}</td>
                <td className="table-cell">{formatCurrency(trade.entryPrice)}</td>
                <td className="table-cell">{formatCurrency(trade.currentPrice)}</td>
                <td className="table-cell">
                  <div className="flex items-center space-x-1">
                    <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {formatCurrency(trade.pnl)}
                    </span>
                    <span className={`text-xs ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ({formatPercent(trade.pnlPercent)})
                    </span>
                    {trade.pnl >= 0 ? (
                      <ArrowUpRight className="text-green-400" size={16} />
                    ) : (
                      <ArrowDownRight className="text-red-400" size={16} />
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  <span className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                    {trade.strategy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ActiveTrades
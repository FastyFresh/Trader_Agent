import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import PortfolioOverview from './PortfolioOverview'
import ActiveTrades from './ActiveTrades'
import PerformanceChart from './PerformanceChart'
import RiskMetrics from './RiskMetrics'
import StrategyManager from './StrategyManager'

// Mock data for initial development
const mockPortfolioData = {
  totalEquity: 750.25,
  cashBalance: 250.75,
  todayReturn: 5.25,
  totalReturn: 50.05,
  riskMetrics: {
    maxDrawdown: 8.5,
    sharpeRatio: 1.8,
    volatility: 12.5,
    valueAtRisk: 15.0,
    exposure: {
      total: 65.5,
      byAsset: {
        'BTC/USD': 30.5,
        'ETH/USD': 20.0,
        'SOL/USD': 15.0
      }
    }
  }
}

const mockPerformanceData = {
  dates: Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split('T')[0]
  }),
  equity: Array.from({ length: 30 }, (_, i) => {
    const baseValue = 500
    const trend = i * 10
    const noise = Math.random() * 20 - 10
    return baseValue + trend + noise
  }),
  returns: Array.from({ length: 30 }, () => {
    return (Math.random() * 4) - 1
  })
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true)

  // Simulate API calls with mock data
  const { data: portfolioData } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsLoading(false)
      return mockPortfolioData
    },
  })

  const { data: performanceData } = useQuery({
    queryKey: ['performance'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      return mockPerformanceData
    },
  })

  if (isLoading || !portfolioData || !performanceData) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Portfolio Overview */}
      <div className="col-span-12 xl:col-span-8">
        <PortfolioOverview data={portfolioData} />
      </div>

      {/* Risk Metrics */}
      <div className="col-span-12 xl:col-span-4">
        <RiskMetrics data={portfolioData} />
      </div>

      {/* Performance Chart */}
      <div className="col-span-12">
        <PerformanceChart data={performanceData} />
      </div>

      {/* Active Trades */}
      <div className="col-span-12 lg:col-span-8">
        <ActiveTrades />
      </div>

      {/* Strategy Manager */}
      <div className="col-span-12 lg:col-span-4">
        <StrategyManager />
      </div>
    </div>
  )
}

export default Dashboard
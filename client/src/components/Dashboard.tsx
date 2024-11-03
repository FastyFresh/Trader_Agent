import { useQuery } from '@tanstack/react-query'
import PortfolioOverview from './PortfolioOverview'
import ActiveTrades from './ActiveTrades'
import PerformanceChart from './PerformanceChart'
import RiskMetrics from './RiskMetrics'
import StrategyManager from './StrategyManager'

const Dashboard = () => {
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/trading/portfolio')
      return response.json()
    },
  })

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/trading/performance')
      return response.json()
    },
  })

  if (portfolioLoading || performanceLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="grid grid-cols-12 gap-4">
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
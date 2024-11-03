import { useEffect, useState } from 'react'

interface Stats {
  pnl: number
  trades: number
  winRate: number
}

const PortfolioStats = () => {
  const [stats, setStats] = useState<Stats>({
    pnl: 0,
    trades: 0,
    winRate: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/autotrader/status')
        const data = await response.json()
        
        if (data.performance) {
          setStats({
            pnl: data.performance.totalPnL || 0,
            trades: data.performance.trades || 0,
            winRate: data.performance.winRate || 0
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    const interval = setInterval(fetchStats, 5000) // Update every 5 seconds
    fetchStats() // Initial fetch

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      backgroundColor: '#1f2937',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginTop: '1rem'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '1rem'
      }}>
        Portfolio Performance
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem'
      }}>
        <div>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Total P&L</p>
          <p style={{ 
            fontSize: '1.25rem',
            color: stats.pnl >= 0 ? '#22c55e' : '#ef4444'
          }}>
            ${stats.pnl.toFixed(2)}
          </p>
        </div>
        
        <div>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Total Trades</p>
          <p style={{ fontSize: '1.25rem' }}>
            {stats.trades}
          </p>
        </div>
        
        <div>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Win Rate</p>
          <p style={{ fontSize: '1.25rem' }}>
            {(stats.winRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}

export default PortfolioStats
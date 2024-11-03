import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface PerformanceData {
  dates: string[]
  equity: number[]
  returns: number[]
}

interface PerformanceChartProps {
  data: PerformanceData
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')

      if (ctx) {
        // Destroy previous chart instance
        if (chartInstance.current) {
          chartInstance.current.destroy()
        }

        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.dates,
            datasets: [
              {
                label: 'Portfolio Value',
                data: data.equity,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
              },
              {
                label: 'Returns %',
                data: data.returns,
                borderColor: '#60A5FA',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'returns',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: '#E5E7EB',
                },
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              },
            },
            scales: {
              x: {
                grid: {
                  color: 'rgba(107, 114, 128, 0.1)',
                },
                ticks: {
                  color: '#9CA3AF',
                },
              },
              y: {
                grid: {
                  color: 'rgba(107, 114, 128, 0.1)',
                },
                ticks: {
                  color: '#9CA3AF',
                  callback: (value) => {
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(value as number)
                  },
                },
              },
              returns: {
                position: 'right',
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  color: '#9CA3AF',
                  callback: (value) => {
                    return `${value}%`
                  },
                },
              },
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          },
        })
      }
    }

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Performance</h2>
        <div className="flex space-x-2">
          <button className="btn-secondary text-sm">1D</button>
          <button className="btn-secondary text-sm">1W</button>
          <button className="btn-primary text-sm">1M</button>
          <button className="btn-secondary text-sm">3M</button>
          <button className="btn-secondary text-sm">1Y</button>
          <button className="btn-secondary text-sm">ALL</button>
        </div>
      </div>
      <div className="h-96">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  )
}

export default PerformanceChart
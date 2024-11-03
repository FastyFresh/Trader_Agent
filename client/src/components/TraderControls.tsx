import { useState } from 'react'

const TraderControls = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState('')

  const startTrading = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/autotrader/start', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setIsRunning(true)
        setStatus('Trading bot is active and searching for opportunities.')
      } else {
        setStatus('Failed to start trading bot.')
      }
    } catch (error) {
      console.error('Error starting trader:', error)
      setStatus('Error connecting to trading server.')
    }
  }

  const stopTrading = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/autotrader/stop', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setIsRunning(false)
        setStatus('Trading bot stopped.')
      } else {
        setStatus('Failed to stop trading bot.')
      }
    } catch (error) {
      console.error('Error stopping trader:', error)
      setStatus('Error connecting to trading server.')
    }
  }

  return (
    <div style={{
      backgroundColor: '#1f2937',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginTop: '1rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Trading Controls
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            {status || 'Ready to start trading'}
          </p>
        </div>
        
        <button
          onClick={isRunning ? stopTrading : startTrading}
          style={{
            backgroundColor: isRunning ? '#dc2626' : '#22c55e',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? 'Stop Trading' : 'Start Trading'}
        </button>
      </div>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '0.375rem',
        padding: '1rem',
        marginTop: '1rem'
      }}>
        <h4 style={{
          fontSize: '0.875rem',
          color: '#9ca3af',
          marginBottom: '0.5rem'
        }}>
          Current Strategy
        </h4>
        <div style={{ fontSize: '0.875rem' }}>
          <p>• Initial Phase (Up to $1,000): Momentum Trading</p>
          <p>• Assets: SOL-PERP, WBTC-PERP</p>
          <p>• Risk Management: Active</p>
        </div>
      </div>

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '0.375rem',
        padding: '1rem',
        marginTop: '1rem'
      }}>
        <h4 style={{
          fontSize: '0.875rem',
          color: '#9ca3af',
          marginBottom: '0.5rem'
        }}>
          Progress to Goal
        </h4>
        <div style={{
          height: '0.5rem',
          backgroundColor: '#1f2937',
          borderRadius: '9999px',
          overflow: 'hidden'
        }}>
          <div
            style={{
              width: '0.1%',
              height: '100%',
              backgroundColor: '#22c55e',
              transition: 'width 0.5s ease'
            }}
          ></div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#9ca3af'
        }}>
          <span>$100</span>
          <span>Goal: $1,000,000</span>
        </div>
      </div>
    </div>
  )
}

export default TraderControls
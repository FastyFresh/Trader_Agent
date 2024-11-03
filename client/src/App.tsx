import { useState } from 'react'
import WalletConnect from './components/WalletConnect'
import TraderControls from './components/TraderControls'
import PortfolioStats from './components/PortfolioStats'

const App = () => {
  const [connected, setConnected] = useState(false)

  const handleConnect = (publicKey: string) => {
    console.log('Wallet connected:', publicKey)
    setConnected(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: 'white',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.25rem'
          }}>
            Trader Agent
          </h1>
          <p style={{
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            Automated trading on Drift Protocol
          </p>
        </div>
        <WalletConnect onConnect={handleConnect} />
      </header>

      <main>
        {connected ? (
          <div>
            {/* Overview Card */}
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                marginBottom: '1rem'
              }}>
                Trading Dashboard
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Current Balance</p>
                  <p style={{ fontSize: '1.25rem', color: '#22c55e' }}>1 SOL</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>≈ $160</p>
                </div>
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Active Strategy</p>
                  <p style={{ fontSize: '1.25rem' }}>Initial Phase</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Momentum Trading</p>
                </div>
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Risk Level</p>
                  <p style={{ fontSize: '1.25rem' }}>Moderate</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>3x max leverage</p>
                </div>
              </div>
            </div>

            {/* Trading Controls */}
            <TraderControls />

            {/* Performance Stats */}
            <PortfolioStats />

            {/* Info Card */}
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#9ca3af'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: 'white'
              }}>
                About Trading Bot
              </h3>
              <p style={{ marginBottom: '0.5rem' }}>
                This trading bot uses advanced algorithms to trade on Drift Protocol, aiming to grow your portfolio from $100 to $1,000,000.
              </p>
              <ul style={{ listStyle: 'disc', marginLeft: '1.5rem' }}>
                <li>Automated trading 24/7</li>
                <li>Dynamic risk management</li>
                <li>Automatic strategy adjustments</li>
                <li>Real-time performance tracking</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '1rem'
            }}>
              Connect Your Wallet
            </h2>
            <p style={{ color: '#9ca3af' }}>
              Connect your Phantom wallet to begin trading
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

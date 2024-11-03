import { useEffect, useState } from 'react'

type WalletConnectProps = {
  onConnect: (publicKey: string) => void
}

const WalletConnect = ({ onConnect }: WalletConnectProps) => {
  const [phantom, setPhantom] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState("")

  useEffect(() => {
    if ("solana" in window) {
      const solWindow = window as any
      setPhantom(solWindow.solana)
    }
  }, [])

  const connectWallet = async () => {
    try {
      if (phantom) {
        const { publicKey } = await phantom.connect()
        console.log('Connected to wallet:', publicKey.toString())
        setConnected(true)
        setPublicKey(publicKey.toString())
        onConnect(publicKey.toString())
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err)
    }
  }

  if (!phantom) {
    return (
      <a 
        href="https://phantom.app/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          backgroundColor: '#9333ea',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          display: 'inline-block'
        }}
      >
        Get Phantom Wallet
      </a>
    )
  }

  if (!connected) {
    return (
      <button
        onClick={connectWallet}
        style={{
          backgroundColor: '#22c55e',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <div style={{ color: '#22c55e' }}>
      Connected: {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
    </div>
  )
}

export default WalletConnect
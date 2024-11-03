import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'

// Initialize WebSocket connection
export const socket = io(WS_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
})

// API endpoints
export const api = {
  // Portfolio endpoints
  getPortfolio: async () => {
    const response = await fetch(`${API_URL}/trading/portfolio`)
    return response.json()
  },

  getPerformance: async () => {
    const response = await fetch(`${API_URL}/trading/performance`)
    return response.json()
  },

  // Trading endpoints
  getActiveTrades: async () => {
    const response = await fetch(`${API_URL}/trading/active-trades`)
    return response.json()
  },

  executeStrategy: async (strategy: string, market: string) => {
    const response = await fetch(`${API_URL}/trading/execute-trade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ strategy, market })
    })
    return response.json()
  },

  getStrategies: async () => {
    const response = await fetch(`${API_URL}/trading/strategies`)
    return response.json()
  },

  // Risk management endpoints
  getRiskAssessment: async (market: string) => {
    const response = await fetch(`${API_URL}/trading/risk-assessment?market=${market}`)
    return response.json()
  },

  getMarketData: async (symbol: string, interval?: string) => {
    const response = await fetch(
      `${API_URL}/trading/market-data?symbol=${symbol}${interval ? `&interval=${interval}` : ''}`
    )
    return response.json()
  }
}

// WebSocket event listeners
socket.on('connect', () => {
  console.log('WebSocket connected')
})

socket.on('disconnect', () => {
  console.log('WebSocket disconnected')
})

socket.on('market_update', (data) => {
  console.log('Market update:', data)
})

socket.on('trade_signal', (data) => {
  console.log('Trade signal:', data)
})

socket.on('portfolio_update', (data) => {
  console.log('Portfolio update:', data)
})

socket.on('error', (error) => {
  console.error('WebSocket error:', error)
})

// Subscribe to market updates
export const subscribeToMarket = (symbol: string) => {
  socket.emit('subscribe_market', symbol)
}

// Unsubscribe from market updates
export const unsubscribeFromMarket = (symbol: string) => {
  socket.emit('unsubscribe_market', symbol)
}

export default api
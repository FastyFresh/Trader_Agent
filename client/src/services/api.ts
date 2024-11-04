import { Socket } from 'socket.io-client';
import socketIOClient from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

let socket: Socket;

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

export interface TradeSignal {
  type: 'long' | 'short';
  symbol: string;
  price: number;
  timestamp: number;
}

export interface PortfolioUpdate {
  balance: number;
  positions: any[];
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// API Functions
export const api = {
  init() {
    socket = socketIOClient(WS_URL);
    
    socket.on('connect', () => {
      console.log('Connected to trading server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from trading server');
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    return socket;
  },

  subscribeToMarketData(callback: (data: MarketData) => void) {
    socket.on('market_update', (data: MarketData) => {
      callback(data);
    });
  },

  subscribeToTradeSignals(callback: (signal: TradeSignal) => void) {
    socket.on('trade_signal', (data: TradeSignal) => {
      callback(data);
    });
  },

  subscribeToPortfolio(callback: (update: PortfolioUpdate) => void) {
    socket.on('portfolio_update', (data: PortfolioUpdate) => {
      callback(data);
    });
  },

  async getMarkets() {
    const response = await fetch(`${API_URL}/api/markets`);
    return response.json();
  },

  async getBalance() {
    const response = await fetch(`${API_URL}/api/balance`);
    return response.json();
  },

  async getStrategies() {
    const response = await fetch(`${API_URL}/api/strategies`);
    return response.json();
  },

  async activateStrategy(id: string) {
    const response = await fetch(`${API_URL}/api/strategies/${id}/activate`, {
      method: 'POST'
    });
    return response.json();
  },

  async deactivateStrategy(id: string) {
    const response = await fetch(`${API_URL}/api/strategies/${id}/deactivate`, {
      method: 'POST'
    });
    return response.json();
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
    }
  }
};

export default api;
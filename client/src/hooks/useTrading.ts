import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TradingStats, TradeConfig, TradeResponse } from '../types/trading';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

const initialStats: TradingStats = {
  accountBalance: 0,
  equity: 0,
  totalPnL: 0,
  pnL24h: 0,
  pnL7d: 0,
  winRate: 0,
  totalTrades: 0,
  accountHealth: 0,
  availableMargin: 0,
  currentGoal: 0,
  progressToGoal: 0
};

export const useTrading = () => {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState<TradingStats>(initialStats);
  const [isTrading, setIsTrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!publicKey) return;

    const socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({
        type: 'auth',
        publicKey: publicKey.toString()
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'stats') {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connect, 1000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      connect();
    }
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect, publicKey]);

  const placeTrade = async (config: TradeConfig): Promise<TradeResponse> => {
    try {
      const response = await fetch(`${API_URL}/api/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publicKey: publicKey?.toString(),
          ...config
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place trade');
      }

      return data;
    } catch (error: any) {
      console.error('Error placing trade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const startTrading = async () => {
    try {
      const response = await fetch(`${API_URL}/api/autotrader/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publicKey: publicKey?.toString()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trading');
      }

      setIsTrading(true);
    } catch (error: any) {
      console.error('Error starting trading:', error);
      setError(error.message);
    }
  };

  const stopTrading = async () => {
    try {
      const response = await fetch(`${API_URL}/api/autotrader/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publicKey: publicKey?.toString()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop trading');
      }

      setIsTrading(false);
    } catch (error: any) {
      console.error('Error stopping trading:', error);
      setError(error.message);
    }
  };

  return {
    stats,
    isTrading,
    error,
    placeTrade,
    startTrading,
    stopTrading
  };
};
import { useState, useEffect, useCallback } from 'react';
import { useConnection } from './useConnection';
import { toast } from 'react-hot-toast';

interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  fundingRate: number;
}

interface PositionData {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  roe: number;
}

export const useTrading = () => {
  const { connected, publicKey } = useConnection();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [positions, setPositions] = useState<PositionData[]>([]);

  const handleMarketUpdate = useCallback((data: any) => {
    if (data.type === 'market_update') {
      setMarketData(data.payload);
    } else if (data.type === 'position_update') {
      setPositions(data.payload);
    }
  }, []);

  useEffect(() => {
    if (!connected) return;

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMarketUpdate(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Error connecting to trading server');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (connected) {
        toast.error('Lost connection to trading server');
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [connected, handleMarketUpdate]);

  const initialize = useCallback(async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/autotrader/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletPublicKey: publicKey
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize trading');
      }

      setIsInitialized(true);
      toast.success('Trading initialized successfully');
    } catch (error) {
      console.error('Error initializing trading:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initialize trading');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  const startTrading = async () => {
    if (!connected) {
      toast.error('Wallet not connected');
      return;
    }

    if (!isInitialized) {
      await initialize();
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/autotrader/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start trading');
      }

      setIsTrading(true);
      toast.success('Trading started successfully');
    } catch (error) {
      console.error('Error starting trading:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start trading');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTrading = async () => {
    if (!connected) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/autotrader/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to stop trading');
      }

      setIsTrading(false);
      toast.success('Trading stopped successfully');
    } catch (error) {
      console.error('Error stopping trading:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to stop trading');
    } finally {
      setIsLoading(false);
    }
  };

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Trading server not responding');
      }
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }, []);

  return {
    isInitialized,
    isTrading,
    isLoading,
    marketData,
    positions,
    initialize,
    startTrading,
    stopTrading,
    checkHealth
  };
};
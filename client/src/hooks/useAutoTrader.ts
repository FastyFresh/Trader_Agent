import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useConnection } from './useConnection';

interface AutoTraderStatus {
  isRunning: boolean;
  currentPhase: string | null;
  activeMarkets: string[];
  currentBalance: number;
  lastUpdate: number | null;
  performance?: {
    totalPnL: number;
    winRate: number;
    trades: number;
    drawdown: number;
  };
}

export const useAutoTrader = () => {
  const { connected, publicKey } = useConnection();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AutoTraderStatus>({
    isRunning: false,
    currentPhase: null,
    activeMarkets: [],
    currentBalance: 0,
    lastUpdate: null
  });

  // Initialize AutoTrader
  const initialize = useCallback(async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/autotrader/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletPublicKey: publicKey
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize AutoTrader');
      }

      setIsInitialized(true);
      toast.success('AutoTrader initialized successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to initialize AutoTrader');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey]);

  // Start trading
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
      const response = await fetch('http://localhost:3000/api/autotrader/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletPublicKey: publicKey
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trading');
      }

      toast.success('Trading started successfully');
      updateStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start trading');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop trading
  const stopTrading = async () => {
    if (!connected) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/autotrader/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletPublicKey: publicKey
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop trading');
      }

      toast.success('Trading stopped successfully');
      updateStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop trading');
    } finally {
      setIsLoading(false);
    }
  };

  // Update status
  const updateStatus = useCallback(async () => {
    if (!connected) return;

    try {
      const response = await fetch('http://localhost:3000/api/autotrader/status');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  }, [connected]);

  // Fetch status on mount and periodically
  useEffect(() => {
    if (!connected) return;

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [connected, updateStatus]);

  // Handle wallet connection changes
  useEffect(() => {
    if (!connected) {
      setIsInitialized(false);
      setStatus({
        isRunning: false,
        currentPhase: null,
        activeMarkets: [],
        currentBalance: 0,
        lastUpdate: null
      });
    }
  }, [connected]);

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return {
    status,
    isInitialized,
    isLoading,
    startTrading,
    stopTrading,
    initialize,
    formatBalance,
    formatPercentage
  };
};
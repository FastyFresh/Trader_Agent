import { useState, useCallback, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { TradingStats, TradeConfig, TradeResponse } from '../types/trading';
import { DriftClient, initialize } from '@drift-labs/sdk';
import { PublicKey } from '@solana/web3.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [stats, setStats] = useState<TradingStats>(initialStats);
  const [isTrading, setIsTrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driftClient, setDriftClient] = useState<DriftClient | null>(null);

  const initializeDrift = useCallback(async () => {
    if (!publicKey || !wallet?.adapter) return;

    try {
      setError(null);
      console.log('Initializing Drift client...');

      // Initialize drift SDK with hardcoded program ID for devnet
      const programId = new PublicKey('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH');

      await initialize({
        env: 'devnet',
        programId
      });

      // Create drift client
      const client = new DriftClient({
        connection,
        wallet: {
          publicKey,
          signTransaction: async (tx) => {
            return await wallet.adapter.signTransaction?.(tx) || tx;
          },
          signAllTransactions: async (txs) => {
            return await wallet.adapter.signAllTransactions?.(txs) || txs;
          }
        },
        programID: programId,
        env: 'devnet',
        userStats: true,
        perpMarkets: true,
        spotMarkets: true,
        accountSubscription: {
          type: 'polling',
          frequency: 1000
        }
      });

      await client.subscribe();
      console.log('Drift client initialized and subscribed');
      setDriftClient(client);
      
    } catch (error: any) {
      console.error('Error initializing Drift:', error);
      setError(error.message || 'Failed to initialize Drift');
    }
  }, [publicKey, wallet, connection]);

  useEffect(() => {
    if (publicKey && wallet?.adapter) {
      initializeDrift();
    }
    return () => {
      if (driftClient) {
        driftClient.unsubscribe();
      }
    };
  }, [publicKey, wallet, initializeDrift]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    // Fetch initial stats
    fetchStats();

    // Set up interval to fetch stats every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  const placeTrade = async (config: TradeConfig): Promise<TradeResponse> => {
    try {
      if (!driftClient) {
        throw new Error('Drift client not initialized');
      }

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

      // Trigger stats update after trade
      await fetchStats();

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
      if (!driftClient) {
        throw new Error('Please wait for connection to initialize');
      }

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
      setError(null);
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
      setError(null);
    } catch (error: any) {
      console.error('Error stopping trading:', error);
      setError(error.message);
    }
  };

  return {
    stats,
    isTrading,
    error,
    isInitialized: !!driftClient,
    placeTrade,
    startTrading,
    stopTrading
  };
};
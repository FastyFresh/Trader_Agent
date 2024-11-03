import { useState, useEffect } from 'react';

declare global {
  interface Window {
    solana?: any;
  }
}

interface UseConnectionReturn {
  connected: boolean;
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export const useConnection = (): UseConnectionReturn => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      try {
        if (window.solana?.isPhantom) {
          const response = await window.solana.connect({ onlyIfTrusted: true });
          setConnected(true);
          setPublicKey(response.publicKey.toString());
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
      }
    };

    checkConnection();

    // Listen for wallet connection changes
    const handleWalletConnection = () => {
      setConnected(true);
      if (window.solana?.publicKey) {
        setPublicKey(window.solana.publicKey.toString());
      }
    };

    const handleWalletDisconnection = () => {
      setConnected(false);
      setPublicKey(null);
    };

    if (window.solana) {
      window.solana.on('connect', handleWalletConnection);
      window.solana.on('disconnect', handleWalletDisconnection);
    }

    return () => {
      if (window.solana) {
        window.solana.off('connect', handleWalletConnection);
        window.solana.off('disconnect', handleWalletDisconnection);
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.solana) {
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet is not installed');
      }

      const response = await window.solana.connect();
      setConnected(true);
      setPublicKey(response.publicKey.toString());
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
        setConnected(false);
        setPublicKey(null);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  return {
    connected,
    publicKey,
    connectWallet,
    disconnectWallet
  };
};
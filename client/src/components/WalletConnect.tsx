import { useEffect, useState } from 'react';
import { PhantomProvider } from '../types/phantom';

const WalletConnect = () => {
  const [provider, setProvider] = useState<PhantomProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [pubKey, setPubKey] = useState('');

  useEffect(() => {
    if ("solana" in window) {
      const solWindow = window as any;
      setProvider(solWindow.solana);
      if (solWindow.solana.isConnected) {
        setConnected(true);
        setPubKey(solWindow.solana.publicKey.toString());
      }
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (provider) {
        const response = await provider.connect();
        setConnected(true);
        setPubKey(response.publicKey.toString());
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (provider) {
        await provider.disconnect();
        setConnected(false);
        setPubKey('');
      }
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    }
  };

  if (!provider) {
    return (
      <a
        href="https://phantom.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
      >
        Get Phantom Wallet
      </a>
    );
  }

  return (
    <div>
      {connected ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">
            {pubKey.slice(0, 4)}...{pubKey.slice(-4)}
          </span>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
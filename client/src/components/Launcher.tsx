import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';

const queryClient = new QueryClient();

const Launcher = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const isHealthy = await api.testConnection();
      if (isHealthy) {
        console.log('Server health check passed');
      }
    } catch (error) {
      console.error('Server health check failed:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await api.init();
      console.log('Successfully connected to WebSocket');
      setIsConnected(true);
    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to connect to trading server. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-900 min-h-screen text-white">
        <div className="container mx-auto px-4 py-8">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
              <h1 className="text-3xl font-bold mb-4">Trader Agent</h1>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={`
                  bg-blue-600 hover:bg-blue-700 text-white font-bold 
                  py-2 px-4 rounded transition-colors
                  ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isConnecting ? 'Connecting...' : 'Connect to Trading Server'}
              </button>
              {error && (
                <div className="mt-4 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Dashboard components will be rendered here */}
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Launcher;
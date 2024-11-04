import { useState } from 'react';
import { Connection } from '@solana/web3.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';

const queryClient = new QueryClient();

const Launcher = () => {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    try {
      await api.init();
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect:', error);
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Connect to Trading Server
              </button>
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
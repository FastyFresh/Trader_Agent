import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Basic WebSocket Implementation
const WS_URL = 'ws://localhost:3000/ws';

const Launcher = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [message, setMessage] = useState<string>('Disconnected');

  const connect = async () => {
    try {
      // Connect Phantom Wallet
      const { solana } = window as any;
      if (!solana?.isPhantom) {
        throw new Error('Phantom wallet not found! Get it from https://phantom.app/');
      }

      setMessage('Connecting to Phantom...');
      const response = await solana.connect();
      setWallet(response);
      console.log('Connected to Phantom:', response.publicKey.toString());

      // Connect WebSocket
      setMessage('Connecting to trading server...');
      console.log('WebSocket URL:', WS_URL);
      
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket opened');
        setMessage('Establishing connection...');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          if (data.type === 'connection_status' && data.status === 'connected') {
            console.log('Server confirmed connection');
            setIsConnected(true);
            setMessage('System Online');
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setMessage('Disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setMessage('Connection error');
      };

    } catch (error: any) {
      console.error('Connection error:', error);
      setMessage(error.message || 'Failed to connect');
    }
  };

  const disconnect = () => {
    window.location.reload();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Trader Agent</h1>
            <p className="text-gray-400">Beta</p>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <button
                onClick={connect}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition duration-200"
              >
                Connect Phantom Wallet
              </button>
              <div className="text-center mt-4">
                <p className="text-gray-400">{message}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-6 bg-gray-700 rounded-lg p-4">
                <div className="text-green-400 font-semibold mb-2">{message}</div>
                <div className="text-gray-300">
                  Connected: {wallet && formatAddress(wallet.publicKey.toString())}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Trading Status</h3>
                  <div className="flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-300">Ready to trade</span>
                  </div>
                </div>

                <button
                  onClick={disconnect}
                  className="w-full bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-600"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-gray-500 text-sm">
            v0.1.0-beta
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Launcher;
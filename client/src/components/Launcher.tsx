import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Basic WebSocket Implementation
const WS_URL = 'ws://localhost:3000/ws';

const Launcher = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Disconnected');
  const [messages, setMessages] = useState<string[]>([]);

  const connect = () => {
    setIsConnecting(true);
    setError(null);
    setStatus('Connecting...');

    // Log connection attempt
    console.log(`Attempting to connect to ${WS_URL}`);
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setStatus('Socket opened, awaiting confirmation...');
      console.log('WebSocket connection opened');
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      setStatus('Disconnected');
      setError(`Connection closed (${event.code}): ${event.reason || 'No reason provided'}`);
      setIsConnecting(false);
      console.log('WebSocket closed:', event);
    };

    socket.onerror = (event) => {
      setStatus('Error occurred');
      console.error('WebSocket error:', event);
      setError('Failed to connect to server');
      setIsConnecting(false);
    };

    socket.onmessage = (event) => {
      console.log('Received message:', event.data);
      
      try {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, JSON.stringify(message, null, 2)]);

        if (message.type === 'connection_status' && message.status === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          setStatus('Connected');
          setError(null);
        } else if (message.type === 'ping') {
          // Respond to ping with pong
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        setMessages(prev => [...prev, `Failed to parse: ${event.data}`]);
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  };

  const handleConnect = () => {
    connect();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-gray-900 min-h-screen text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h1 className="text-3xl font-bold mb-4">Trader Agent</h1>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className={`h-3 w-3 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 
                  isConnecting ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}></div>
                <span>{status}</span>
              </div>
              
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={`
                  bg-blue-600 hover:bg-blue-700 text-white font-bold 
                  py-2 px-4 rounded transition-colors w-full
                  ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isConnecting ? 'Connecting...' : isConnected ? 'Reconnect' : 'Connect to Trading Server'}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-900/50 rounded-lg text-red-200">
                <h3 className="font-bold mb-2">Error</h3>
                <p>{error}</p>
              </div>
            )}

            {messages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2">Messages</h3>
                <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div key={index} className="mb-2 font-mono text-sm">
                      <pre className="whitespace-pre-wrap">{msg}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isConnected && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Trading Interface</h2>
              <p>Connected and ready for trading.</p>
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default Launcher;
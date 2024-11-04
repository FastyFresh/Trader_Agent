const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface TradeSignal {
  type: 'long' | 'short';
  symbol: string;
  price: number;
  timestamp: number;
}

interface PortfolioUpdate {
  balance: number;
  positions: any[];
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

class API {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Initializing WebSocket connection to:', WS_URL);
      
      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('Connected to trading server');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onclose = () => {
          console.log('Disconnected from trading server');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to trading server after multiple attempts'));
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

      } catch (error) {
        console.error('Error initializing WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
      
      if (this.reconnectTimeout) {
        window.clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = window.setTimeout(() => {
        this.init().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'market_update':
        this.emit('market_update', data.data);
        break;
      case 'trade_signal':
        this.emit('trade_signal', data.data);
        break;
      case 'portfolio_update':
        this.emit('portfolio_update', data.data);
        break;
      case 'error':
        console.error('Server error:', data.error);
        this.emit('error', data.error);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  private eventHandlers: { [key: string]: ((data: any) => void)[] } = {};

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  private on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  subscribeToMarketData(callback: (data: MarketData) => void): void {
    this.on('market_update', callback);
  }

  subscribeToTradeSignals(callback: (signal: TradeSignal) => void): void {
    this.on('trade_signal', callback);
  }

  subscribeToPortfolio(callback: (update: PortfolioUpdate) => void): void {
    this.on('portfolio_update', callback);
  }

  async getMarkets(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/markets`);
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  async getBalance(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/balance`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async getStrategies(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/strategies`);
      if (!response.ok) {
        throw new Error('Failed to fetch strategies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.ws) {
      console.log('Disconnecting from trading server');
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.eventHandlers = {};
    this.reconnectAttempts = 0;
  }

  sendMessage(type: string, data: any = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = JSON.stringify({ type, ...data });
    this.ws.send(message);
  }
}

export const api = new API();
export default api;
export interface TradingStats {
  accountBalance: number;
  equity: number;
  totalPnL: number;
  pnL24h: number;
  pnL7d: number;
  winRate: number;
  totalTrades: number;
  accountHealth: number;
  availableMargin: number;
  currentGoal: number;
  progressToGoal: number;
}

export interface TradingParameters {
  maxPositionSize: number;
  maxLeverage: number;
  riskPerTrade: number;
  stopLoss: number;
}

export interface TradeConfig {
  symbol: string;
  size: number;
  leverage: number;
  direction: 'long' | 'short';
  stopLoss: number;
}

export interface TradeResponse {
  success: boolean;
  orderId?: string;
  error?: string;
  symbol?: string;
  size?: number;
  direction?: 'long' | 'short';
  price?: number;
  timestamp?: number;
}
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DataPoint {
  timestamp: string;
  value: number;
  profit: number;
}

const PerformanceChart = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('24h');

  useEffect(() => {
    // Simulate data for now - replace with real API call
    const generateData = () => {
      const points: DataPoint[] = [];
      const now = new Date();
      let pointsCount = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 60;
      let initialValue = 125; // Starting with $125
      let currentValue = initialValue;
      let currentProfit = 0;

      for (let i = 0; i < pointsCount; i++) {
        const change = (Math.random() - 0.3) * 0.05; // Slight upward bias
        currentValue = currentValue * (1 + change);
        currentProfit = currentValue - initialValue;

        const timestamp = new Date(now);
        if (timeframe === '24h') {
          timestamp.setHours(now.getHours() - (pointsCount - i));
        } else {
          timestamp.setDate(now.getDate() - (pointsCount - i));
        }

        points.push({
          timestamp: timestamp.toLocaleString(),
          value: parseFloat(currentValue.toFixed(2)),
          profit: parseFloat(currentProfit.toFixed(2))
        });
      }

      return points;
    };

    setData(generateData());
  }, [timeframe]);

  return (
    <div className="Card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="Heading2">Portfolio Performance</h2>
          <div className="flex space-x-2">
            {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  timeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return timeframe === '24h'
                    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString();
                }}
                stroke="#9CA3AF"
              />
              <YAxis
                yAxisId="left"
                stroke="#9CA3AF"
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Portfolio Value"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profit"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Profit/Loss"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Current Value</div>
            <div className="text-2xl font-bold text-blue-500">
              ${data[data.length - 1]?.value.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Profit/Loss</div>
            <div className={`text-2xl font-bold ${
              (data[data.length - 1]?.profit || 0) >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {(data[data.length - 1]?.profit || 0) >= 0 ? '+' : ''}$
              {data[data.length - 1]?.profit.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
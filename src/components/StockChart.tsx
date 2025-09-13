import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface StockData {
  time: string;
  price: number;
}

interface StockChartProps {
  data: StockData[];
  currentPrice: number;
  isPositive: boolean;
}

export function StockChart({ data, currentPrice, isPositive }: StockChartProps) {
  return (
    <div className="relative h-80 w-full bg-black/20 border-2 border-yellow-400 rounded-lg p-4">
      <div className="absolute top-2 left-2 z-10">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`px-3 py-1 rounded ${isPositive ? 'bg-green-500' : 'bg-red-500'} text-white font-bold`}
        >
          ${currentPrice.toFixed(2)}
        </motion.div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#fff', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#fff', fontSize: 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, stroke: '#fbbf24', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
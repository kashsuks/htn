import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PortfolioGraphProps {
  totalValue: number;
  startValue: number;
}

export function PortfolioGraph({ totalValue, startValue }: PortfolioGraphProps) {
  // Generate mock historical data for the graph
  const generateGraphData = () => {
    const data = [];
    const points = 20;
    const timeRange = 30; // 30 seconds
    
    for (let i = 0; i <= points; i++) {
      const timeElapsed = (i / points) * timeRange;
      const progress = i / points;
      
      // Create a realistic trading curve that leads to current value
      let value = startValue;
      
      if (progress < 0.3) {
        // Early volatility
        value += (Math.sin(progress * 10) * 200) + (progress * 100);
      } else if (progress < 0.7) {
        // Mid-game trends
        value += (Math.cos(progress * 8) * 300) + (progress * 200);
      } else {
        // Converge to actual current value
        const remaining = 1 - progress;
        const targetDiff = totalValue - startValue;
        value = startValue + (targetDiff * progress) + (Math.sin(progress * 15) * 100 * remaining);
      }
      
      // Ensure final point matches actual value
      if (i === points) {
        value = totalValue;
      }
      
      data.push({
        time: Math.round(timeElapsed),
        value: Math.max(0, value),
        label: `${Math.round(timeElapsed)}s`
      });
    }
    
    return data;
  };

  const graphData = generateGraphData();
  const profit = totalValue - startValue;
  const isProfit = profit >= 0;
  
  return (
    <div className="w-full h-48 mb-6">
      <div className="pixel-font text-sm neon-blue mb-2 text-center">
        📈 PORTFOLIO PERFORMANCE
      </div>
      
      <div className="relative bg-gray-900 border-2 border-blue-500 neon-border-blue p-4 h-40">
        <div className="absolute inset-0 scanlines pointer-events-none" />
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={graphData}>
            <XAxis 
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#00e1ff', fontFamily: 'Courier New' }}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#00e1ff', fontFamily: 'Courier New' }}
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
            />
            
            {/* Reference line for starting value */}
            <ReferenceLine 
              y={startValue} 
              stroke="#fff900" 
              strokeDasharray="3 3" 
              strokeWidth={1}
            />
            
            {/* Main portfolio line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={isProfit ? '#00e1ff' : '#ff0000'}
              strokeWidth={3}
              dot={false}
              filter="drop-shadow(0 0 3px currentColor)"
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Grid overlay for retro feel */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00e1ff" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>
      
      {/* Performance indicator */}
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`text-center mt-2 pixel-font text-lg ${isProfit ? 'neon-blue' : 'neon-red'}`}
      >
        {isProfit ? '▲' : '▼'} {isProfit ? '+' : ''}${profit.toFixed(2)} ({((profit/startValue)*100).toFixed(1)}%)
      </motion.div>
    </div>
  );
}
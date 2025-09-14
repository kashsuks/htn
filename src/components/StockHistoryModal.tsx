import React from 'react';
import { motion } from 'motion/react';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
}

interface StockHistoryPoint {
  day: number;
  price: number;
  timestamp: number;
}

interface StockHistoryModalProps {
  stock: Stock | null;
  history: StockHistoryPoint[];
  isOpen: boolean;
  onClose: () => void;
}

export function StockHistoryModal({ stock, history, isOpen, onClose }: StockHistoryModalProps) {
  if (!isOpen || !stock) return null;

  // Calculate chart dimensions and data
  const maxPrice = Math.max(...history.map(h => h.price));
  const minPrice = Math.min(...history.map(h => h.price));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding
  
  const chartHeight = 300;
  const chartWidth = 600;
  const pointSpacing = chartWidth / Math.max(history.length - 1, 1);

  // Generate SVG path for the line chart
  const generatePath = () => {
    if (history.length < 2) return '';
    
    const points = history.map((point, index) => {
      const x = index * pointSpacing;
      const y = chartHeight - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  // Calculate total return
  const firstPrice = history[0]?.price || stock.price;
  const lastPrice = history[history.length - 1]?.price || stock.price;
  const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gray-900 border-4 neon-border-cyan p-6 rounded-lg max-w-4xl w-full mx-4"
        style={{backgroundColor: '#061625'}}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl neon-cyan font-bold">{stock.symbol}</h2>
            <p className="text-white text-lg">{stock.name}</p>
            <p className="text-gray-400">{stock.sector}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Price Info */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center border-2 neon-border-blue p-4" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
            <div className="text-sm neon-blue">CURRENT PRICE</div>
            <div className="text-2xl neon-yellow">${stock.price.toFixed(2)}</div>
          </div>
          <div className="text-center border-2 neon-border-green p-4" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
            <div className="text-sm neon-green">TODAY'S CHANGE</div>
            <div className={`text-2xl ${stock.changePercent >= 0 ? 'neon-blue' : 'neon-red'}`}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </div>
          </div>
          <div className="text-center border-2 neon-border-purple p-4" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
            <div className="text-sm neon-purple">TOTAL RETURN</div>
            <div className={`text-2xl ${totalReturn >= 0 ? 'neon-blue' : 'neon-red'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="border-2 neon-border-yellow p-4" style={{backgroundColor: 'rgba(255, 249, 0, 0.1)'}}>
          <h3 className="text-xl neon-yellow mb-4 text-center">📈 PRICE HISTORY</h3>
          <div className="flex justify-center">
            <svg width={chartWidth} height={chartHeight} className="border border-gray-600">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <g key={index}>
                  <line
                    x1={0}
                    y1={chartHeight * ratio}
                    x2={chartWidth}
                    y2={chartHeight * ratio}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={-10}
                    y={chartHeight * ratio + 5}
                    fill="white"
                    fontSize="12"
                    textAnchor="end"
                  >
                    ${(maxPrice - (priceRange * ratio)).toFixed(0)}
                  </text>
                </g>
              ))}
              
              {/* Price line */}
              <path
                d={generatePath()}
                stroke="#00ffff"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {history.map((point, index) => {
                const x = index * pointSpacing;
                const y = chartHeight - ((point.price - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#00ffff"
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>
                      Day {point.day}: ${point.price.toFixed(2)}
                    </title>
                  </circle>
                );
              })}
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Day 1</span>
            <span>Day {Math.ceil(history.length / 2)}</span>
            <span>Day {history.length}</span>
          </div>
        </div>

        {/* History Table */}
        <div className="mt-6">
          <h3 className="text-lg neon-cyan mb-3">📊 DETAILED HISTORY</h3>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left neon-blue py-2">Day</th>
                  <th className="text-right neon-blue py-2">Price</th>
                  <th className="text-right neon-blue py-2">Change</th>
                  <th className="text-right neon-blue py-2">Change %</th>
                </tr>
              </thead>
              <tbody>
                {history.map((point, index) => {
                  const prevPrice = index > 0 ? history[index - 1].price : point.price;
                  const change = point.price - prevPrice;
                  const changePercent = (change / prevPrice) * 100;
                  
                  return (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="text-white py-1">Day {point.day}</td>
                      <td className="text-right text-white py-1">${point.price.toFixed(2)}</td>
                      <td className={`text-right py-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}${change.toFixed(2)}
                      </td>
                      <td className={`text-right py-1 ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

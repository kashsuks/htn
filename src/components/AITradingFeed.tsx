import { motion, AnimatePresence } from 'motion/react';

interface AITrade {
  id: string;
  action: 'BUY' | 'SELL';
  stock: string;
  shares: number;
  price: number;
  timestamp: number;
}

interface AITradingFeedProps {
  trades: AITrade[];
  currentValue: number;
  startValue: number;
}

export function AITradingFeed({ trades, currentValue, startValue }: AITradingFeedProps) {
  const profit = currentValue - startValue;
  const profitPercent = ((currentValue - startValue) / startValue) * 100;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t-4 border-green-400 p-4 h-48 overflow-hidden">
      <div className="scanlines h-full">
        <div className="pixel-font flex items-center justify-between mb-4">
          <div className="text-green-400 text-xl neon-text">
            🤖 AI TRADING SYSTEM ACTIVE
          </div>
          <div className="flex items-center gap-6">
            <div className="text-cyan-400">
              VALUE: <span className="text-white">${currentValue.toFixed(2)}</span>
            </div>
            <div className={`${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              P&L: {profit >= 0 ? '+' : ''}${profit.toFixed(2)} ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
        
        <div className="h-32 overflow-y-auto space-y-1 custom-scrollbar">
          <AnimatePresence>
            {trades.slice(-10).map((trade) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                className="pixel-font text-sm flex items-center justify-between bg-gray-900 border border-gray-700 p-2 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className={`${trade.action === 'BUY' ? 'text-green-400' : 'text-red-400'} font-bold`}>
                    {trade.action === 'BUY' ? '📈 BUY' : '📉 SELL'}
                  </div>
                  <div className="text-cyan-400">
                    {trade.stock}
                  </div>
                  <div className="text-white">
                    {trade.shares}x @ ${trade.price.toFixed(2)}
                  </div>
                </div>
                <div className="text-yellow-400">
                  ${(trade.shares * trade.price).toFixed(2)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border: 1px solid #00ff00;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00ff00;
          border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00cc00;
        }
      `}</style>
    </div>
  );
}
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { StockChart } from './StockChart';
import { X } from 'lucide-react';

interface StockData {
  time: string;
  price: number;
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[];
  portfolio: {[key: string]: number};
  cash: number;
  chartData: StockData[];
  selectedStock: Stock;
  onSelectStock: (stock: Stock) => void;
  onBuy: (stock: Stock) => void;
  onSell: (stock: Stock) => void;
}

export function TradingModal({
  isOpen,
  onClose,
  stocks,
  portfolio,
  cash,
  chartData,
  selectedStock,
  onSelectStock,
  onBuy,
  onSell
}: TradingModalProps) {
  const currentPrice = chartData[chartData.length - 1]?.price || selectedStock.price;
  const isPositive = chartData.length > 1 ? 
    currentPrice > chartData[chartData.length - 2].price : true;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-black border-4 border-green-400 neon-border w-full max-w-6xl max-h-[90vh] overflow-hidden scanlines pixel-font"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b-2 border-green-400">
              <h2 className="text-3xl text-green-400 neon-text">💰 STOCK TRADING</h2>
              <button
                onClick={onClose}
                className="text-green-400 hover:text-cyan-400 transition-colors neon-text"
              >
                <X size={32} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Stock List */}
              <div className="space-y-4">
                <h3 className="text-xl text-green-400 border-b border-green-400 pb-2 neon-text">
                  AVAILABLE STOCKS
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stocks.map((stock) => (
                    <motion.div
                      key={stock.symbol}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 border-2 cursor-pointer transition-all ${
                        selectedStock.symbol === stock.symbol
                          ? 'border-green-400 bg-green-400/20 neon-border'
                          : 'border-gray-600 bg-gray-900 hover:border-green-400'
                      }`}
                      onClick={() => onSelectStock(stock)}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="text-cyan-400 text-lg neon-text">{stock.symbol}</div>
                          <div className="text-sm text-green-300">{stock.name}</div>
                        </div>
                        <div className={`text-lg neon-text ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${stock.price.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-green-300">
                          OWNED: <span className="text-cyan-400 neon-text">{portfolio[stock.symbol] || 0}</span> SHARES
                        </div>
                        <div className={`text-sm ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-500 border-2 border-green-400 flex-1 pixel-font neon-border"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBuy(stock);
                          }}
                          disabled={cash < stock.price}
                        >
                          BUY ${stock.price.toFixed(2)}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-white flex-1 pixel-font bg-gray-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSell(stock);
                          }}
                          disabled={!portfolio[stock.symbol] || portfolio[stock.symbol] === 0}
                        >
                          SELL
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div>
                <div className="mb-4">
                  <h3 className="text-xl text-green-400 border-b border-green-400 pb-2 neon-text">
                    {selectedStock.symbol} - {selectedStock.name}
                  </h3>
                </div>
                <StockChart 
                  data={chartData} 
                  currentPrice={currentPrice}
                  isPositive={isPositive}
                />
                
                {/* Quick Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 border-2 border-cyan-400 p-3 text-center">
                    <div className="text-sm text-green-300">YOUR CASH</div>
                    <div className="text-xl text-cyan-400 neon-text">${cash.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-900 border-2 border-yellow-400 p-3 text-center">
                    <div className="text-sm text-green-300">SHARES OWNED</div>
                    <div className="text-xl text-yellow-400 neon-text">{portfolio[selectedStock.symbol] || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
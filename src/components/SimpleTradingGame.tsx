import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { PortfolioView } from './PortfolioView';
import { StockHistoryModal } from './StockHistoryModal';

interface GameConfig {
  goal: string;
  cost: number;
  timeframe: number;
  initialCash: number;
}

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

interface SimpleTradingGameProps {
  gameConfig: GameConfig;
  isAITurn: boolean;
  onComplete: (score: number) => void;
  roundNumber: number;
  timeFrame: number;
}

export function SimpleTradingGame({ 
  gameConfig, 
  isAITurn, 
  onComplete, 
  roundNumber, 
  timeFrame 
}: SimpleTradingGameProps) {
  // Game state
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<{[key: string]: number}>({});
  const [cash, setCash] = useState(gameConfig.initialCash);
  const [timeLeft, setTimeLeft] = useState(timeFrame * 5); // 5 seconds per day
  const [currentDay, setCurrentDay] = useState(1);
  const [isLoading] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [stockHistory, setStockHistory] = useState<{[key: string]: StockHistoryPoint[]}>({});
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Stock definitions
  const STOCK_DEFINITIONS: Omit<Stock, 'price' | 'change' | 'changePercent'>[] = [
    { symbol: 'TECH', name: 'TechGiant Inc', sector: 'Technology' },
    { symbol: 'OILC', name: 'OilCorp', sector: 'Energy' },
    { symbol: 'MEDX', name: 'MediXplore', sector: 'Healthcare' },
    { symbol: 'FINT', name: 'FinTech Plus', sector: 'Finance' },
    { symbol: 'RETA', name: 'RetailPro', sector: 'Consumer' },
    { symbol: 'AUTO', name: 'AutoDrive', sector: 'Automotive' },
    { symbol: 'REAL', name: 'RealEstate Co', sector: 'Real Estate' },
    { symbol: 'UTIL', name: 'PowerGrid', sector: 'Utilities' }
  ];

  // Initialize stocks with random prices
  useEffect(() => {
    const initialStocks: Stock[] = STOCK_DEFINITIONS.map(stock => {
      const basePrice = 50 + Math.random() * 200; // $50-$250 range
          return {
        ...stock,
        price: basePrice,
        change: 0,
        changePercent: 0
          };
        });
    setStocks(initialStocks);
    
    // Initialize stock history with initial prices
    const initialHistory: {[key: string]: StockHistoryPoint[]} = {};
    initialStocks.forEach(stock => {
      initialHistory[stock.symbol] = [{
        day: 1,
        price: stock.price,
        timestamp: Date.now()
      }];
    });
    setStockHistory(initialHistory);
  }, []);

  // Update stock prices every 5 seconds (daily)
  useEffect(() => {
    if (gameComplete) return;
    
    const interval = setInterval(() => {
      setStocks(prevStocks => {
        const updatedStocks = prevStocks.map(stock => {
          // Generate realistic price movement (-5% to +5%)
          const changePercent = (Math.random() - 0.5) * 10;
          const newPrice = Math.max(1, stock.price * (1 + changePercent / 100));
          const change = newPrice - stock.price;
          
          console.log(`📊 ${stock.symbol}: $${stock.price.toFixed(2)} → $${newPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
          
          return {
            ...stock,
            price: newPrice,
            change: change,
            changePercent: changePercent
          };
        });
        
        // Update stock history
        setStockHistory(prevHistory => {
          const newHistory = { ...prevHistory };
          updatedStocks.forEach(stock => {
            if (!newHistory[stock.symbol]) {
              newHistory[stock.symbol] = [];
            }
            newHistory[stock.symbol].push({
              day: currentDay + 1,
              price: stock.price,
              timestamp: Date.now()
            });
          });
          return newHistory;
        });
        
        // Update day counter
        setCurrentDay(prevDay => {
          const newDay = Math.min(prevDay + 1, timeFrame);
          console.log(`📅 Day ${newDay}/${timeFrame}`);
          return newDay;
        });
        
        return updatedStocks;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [gameComplete, timeFrame]);

  // Timer countdown
  useEffect(() => {
    if (gameComplete) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameComplete]);

  // Complete game when time runs out
  useEffect(() => {
    if (gameComplete) {
      const totalValue = calculateTotalValue();
      console.log(`🏁 Game complete! Final value: $${totalValue.toFixed(2)}`);
      onComplete(totalValue);
    }
  }, [gameComplete, onComplete]);

  const calculateTotalValue = useCallback(() => {
    const stockValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
                const stock = stocks.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * shares : 0);
              }, 0);
    return cash + stockValue;
  }, [portfolio, stocks, cash]);

  const buyStock = useCallback((stock: Stock, shares: number = 1) => {
    const cost = stock.price * shares;
    if (cash >= cost) {
      setCash(prev => prev - cost);
      setPortfolio(prev => ({
        ...prev,
        [stock.symbol]: (prev[stock.symbol] || 0) + shares
      }));
      console.log(`💰 Bought ${shares} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
    }
  }, [cash]);

  const sellStock = useCallback((stock: Stock, shares: number = 1) => {
    if (portfolio[stock.symbol] >= shares) {
      const revenue = stock.price * shares;
      setCash(prev => prev + revenue);
      setPortfolio(prev => ({
          ...prev,
        [stock.symbol]: prev[stock.symbol] - shares
      }));
      console.log(`💸 Sold ${shares} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
    }
  }, [portfolio]);

  const totalValue = calculateTotalValue();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-2xl">Loading Game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl neon-pink mb-4"
        >
          {isAITurn ? '🤖 AI TRADER' : '👤 HUMAN TRADER'}
        </motion.div>
        
        <div className="text-lg text-white mb-4">
          DAY {currentDay} OF {timeFrame} | {timeLeft}S REMAINING
        </div>
      </div>

      {/* Portfolio View */}
      <PortfolioView
        portfolio={portfolio}
        stocks={stocks}
        cash={cash}
        totalValue={totalValue}
        timeLeft={timeLeft}
        totalTime={timeFrame * 5}
        startValue={gameConfig.initialCash}
        isAITurn={isAITurn}
        onTrade={() => {}}
      />

      {/* Stock Market */}
      <div className="mb-8">
        <h3 className="text-xl neon-cyan mb-4">📈 STOCK MARKET</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stocks.map((stock) => (
            <motion.div
              key={stock.symbol}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-2 neon-border-cyan p-4 rounded-lg cursor-pointer"
              style={{backgroundColor: 'rgba(0, 255, 255, 0.1)'}}
              onClick={() => setSelectedStock(stock)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="neon-cyan font-bold">{stock.symbol}</div>
                  <div className="text-sm text-white">{stock.name}</div>
                  <div className="text-xs text-gray-400">{stock.sector}</div>
                  <div className="text-xs text-cyan-400 mt-1">📊 Click for chart</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">${stock.price.toFixed(2)}</div>
                  <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {!isAITurn && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => buyStock(stock, 1)}
                    disabled={cash < stock.price}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Buy 1
                  </button>
          <button
                    onClick={() => sellStock(stock, 1)}
                    disabled={(portfolio[stock.symbol] || 0) < 1}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Sell 1
          </button>
        </div>
      )}

              {portfolio[stock.symbol] > 0 && (
                <div className="text-xs text-white mt-2">
                  Own: {portfolio[stock.symbol]} shares
                </div>
              )}
            </motion.div>
          ))}
              </div>
            </div>

      {/* Game Info */}
      <div className="border-4 neon-border-yellow p-6 rounded-lg" style={{backgroundColor: 'rgba(255, 249, 0, 0.1)'}}>
        <h3 className="text-xl neon-yellow mb-4">GAME INFO</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong className="neon-blue">GOAL:</strong><br />
            <span className="text-white">{gameConfig.goal}</span>
                  </div>
          <div>
            <strong className="neon-pink">TARGET:</strong><br />
            <span className="text-white">${gameConfig.cost.toLocaleString()}</span>
                </div>
          <div>
            <strong className="neon-yellow">ROUND:</strong><br />
            <span className="text-white">{roundNumber}</span>
                  </div>
          <div>
            <strong className="neon-green">CURRENT VALUE:</strong><br />
            <span className="text-white">${totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

      {/* Stock History Modal */}
      <StockHistoryModal
        stock={selectedStock}
        history={selectedStock ? (stockHistory[selectedStock.symbol] || []) : []}
        isOpen={selectedStock !== null}
        onClose={() => setSelectedStock(null)}
      />
    </div>
  );
}

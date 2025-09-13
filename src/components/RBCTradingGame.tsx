import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { PortfolioView } from './PortfolioView';
import { TradingModal } from './TradingModal';
import { NewsTicker } from './NewsTicker';
import { CharacterPopup } from './CharacterPopup';
import { AITradingFeed } from './AITradingFeed';
import { rbcApi, Client, Portfolio } from '../services/rbcApi';
import { GameConfig } from './GameSetup';

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

interface AITrade {
  id: string;
  action: 'BUY' | 'SELL';
  stock: string;
  shares: number;
  price: number;
  timestamp: number;
}

interface RBCTradingGameProps {
  gameConfig: GameConfig;
  isAITurn: boolean;
  onComplete: (score: number) => void;
  roundNumber: number;
}

// Mock stock data that will be used for both player and AI
const MOCK_STOCKS: Stock[] = [
  { symbol: 'TECH', name: 'TechCorp', price: 150.00, change: 0 },
  { symbol: 'ENER', name: 'EnergyPlus', price: 89.50, change: 0 },
  { symbol: 'HEAL', name: 'HealthMax', price: 210.75, change: 0 },
  { symbol: 'FINA', name: 'FinanceOne', price: 95.25, change: 0 },
  { symbol: 'AUTO', name: 'AutoDrive', price: 120.30, change: 0 },
  { symbol: 'RETA', name: 'RetailPro', price: 75.80, change: 0 }
];

export function RBCTradingGame({ gameConfig, isAITurn, onComplete, roundNumber }: RBCTradingGameProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
  const [selectedStock, setSelectedStock] = useState<Stock>(MOCK_STOCKS[0]);
  const [chartData, setChartData] = useState<StockData[]>([]);
  const [timeLeft, setTimeLeft] = useState(gameConfig.timeframe * 2); // Convert days to seconds (1 sec = 0.5 days)
  const [totalTime] = useState(gameConfig.timeframe * 2);
  const [gameComplete, setGameComplete] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [aiTrades, setAiTrades] = useState<AITrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentValue, setCurrentValue] = useState(gameConfig.initialCash);
  const [goalReached, setGoalReached] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize client and portfolio
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        
        // Create a client for this game session with unique email
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const clientData = {
          name: isAITurn ? `AI Player Round ${roundNumber}` : `Human Player Round ${roundNumber}`,
          email: isAITurn ? `ai${roundNumber}_${timestamp}_${randomId}@stockfighter.com` : `human${roundNumber}_${timestamp}_${randomId}@stockfighter.com`,
          cash: gameConfig.initialCash
        };

        const newClient = await rbcApi.createClient(clientData);
        console.log('Created client:', newClient);
        setClient(newClient);

        // Create a balanced portfolio for the client
        const portfolioData = {
          type: 'balanced',
          initialAmount: gameConfig.initialCash
        };

        const newPortfolio = await rbcApi.createPortfolio(newClient.id, portfolioData);
        console.log('Created portfolio:', newPortfolio);
        setPortfolio(newPortfolio);
        setCurrentValue(newPortfolio.current_value);

        // Initialize chart data
        const initialData: StockData[] = [];
        for (let i = 0; i < 20; i++) {
          initialData.push({
            time: `${i}s`,
            price: selectedStock.price + (Math.random() - 0.5) * 10
          });
        }
        setChartData(initialData);

      } catch (err) {
        console.error('Game initialization error:', err);
        if (err instanceof Error) {
          if (err.message.includes('email already exists')) {
            setError('Client already exists. Please try again or refresh the page.');
          } else {
            setError(`Failed to initialize game: ${err.message}`);
          }
        } else {
          setError('Failed to initialize game. Please check your connection and try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeGame();
  }, [gameConfig, isAITurn, roundNumber, selectedStock.price]);

  // Update stock prices and chart
  useEffect(() => {
    if (timeLeft <= 0 || gameComplete || !portfolio) return;
    
    console.log('📈 Starting stock price updates', { timeLeft, gameComplete, portfolio: !!portfolio });
    
    const interval = setInterval(() => {
      setStocks(prevStocks => {
        const updatedStocks = prevStocks.map(stock => {
          const change = (Math.random() - 0.5) * 5;
          const newPrice = Math.max(10, stock.price + change);
          console.log(`📊 ${stock.symbol}: $${stock.price.toFixed(2)} → $${newPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`);
          return {
            ...stock,
            price: newPrice,
            change: change
          };
        });
        return updatedStocks;
      });

      setChartData(prevData => {
        const newData = [...prevData.slice(1)];
        const lastPrice = prevData[prevData.length - 1]?.price || 100;
        const change = (Math.random() - 0.5) * 8;
        newData.push({
          time: `${Date.now() % 100}s`,
          price: Math.max(10, lastPrice + change)
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, gameComplete, portfolio]);

  // Update portfolio value
  useEffect(() => {
    if (!portfolio) return;
    
    const updateValue = async () => {
      try {
        console.log('🔄 Updating portfolio value...', { portfolioId: portfolio.id, currentValue: portfolio.current_value });
        const updatedPortfolio = await rbcApi.getPortfolio(portfolio.id);
        console.log('📊 Portfolio updated:', updatedPortfolio);
        setPortfolio(updatedPortfolio);
        setCurrentValue(updatedPortfolio.current_value);
        
        // Check if goal is reached
        if (updatedPortfolio.current_value >= gameConfig.cost) {
          console.log('🎯 GOAL REACHED!', { current: updatedPortfolio.current_value, target: gameConfig.cost });
          setGoalReached(true);
        }
      } catch (err) {
        console.error('❌ Failed to update portfolio value:', err);
      }
    };

    const interval = setInterval(updateValue, 2000);
    return () => clearInterval(interval);
  }, [portfolio, gameConfig.cost]);

  // Timer countdown
  useEffect(() => {
    if (gameComplete || !portfolio) return;
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        console.log('⏰ Timer tick:', { timeLeft: timeLeft - 1, gameComplete, isAITurn });
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      console.log('🏁 GAME COMPLETE!', { currentValue, isAITurn, roundNumber });
      setGameComplete(true);
      setShowTradingModal(false);
      onComplete(currentValue);
    }
  }, [timeLeft, currentValue, onComplete, gameComplete, portfolio, isAITurn, roundNumber]);

  // AI trading logic
  useEffect(() => {
    if (!isAITurn || timeLeft <= 0 || gameComplete || !portfolio) return;
    
    console.log('🤖 AI trading logic started', { isAITurn, timeLeft, gameComplete, portfolio: !!portfolio });
    
    const aiTradeInterval = setInterval(async () => {
      try {
        console.log('🤖 AI making trading decision...', { clientCash: client?.cash, portfolioValue: portfolio?.current_value });
        
        // AI makes "smart" trades based on trends
        const bestStock = stocks.reduce((best, current) => 
          current.change > best.change ? current : best
        );
        
        const shouldTrade = Math.random() > 0.4;
        const shouldBuy = Math.random() > 0.3;
        
        console.log('🤖 AI decision:', { shouldTrade, shouldBuy, bestStock: bestStock.symbol, bestStockChange: bestStock.change });
        
        if (shouldTrade) {
          if (shouldBuy && client && client.cash >= bestStock.price) {
            const sharesToBuy = Math.floor(Math.random() * 3) + 1;
            const cost = bestStock.price * sharesToBuy;
            
            console.log('🤖 AI attempting to buy:', { stock: bestStock.symbol, shares: sharesToBuy, cost, availableCash: client.cash });
            
            if (client.cash >= cost) {
              // Simulate AI trade locally first (same as player)
              const newClientCash = client.cash - cost;
              const newPortfolioValue = portfolio.current_value + cost;
              
              setClient(prev => ({ ...prev, cash: newClientCash }));
              setPortfolio(prev => ({ ...prev, current_value: newPortfolioValue }));
              setCurrentValue(newPortfolioValue);
              
              // Record AI trade
              const newTrade: AITrade = {
                id: `${Date.now()}-${Math.random()}`,
                action: 'BUY',
                stock: bestStock.symbol,
                shares: sharesToBuy,
                price: bestStock.price,
                timestamp: Date.now()
              };
              
              setAiTrades(prev => [...prev, newTrade]);
              console.log('🤖 AI bought stock:', newTrade);
              
              // Try API sync
              try {
                await rbcApi.transferToPortfolio(portfolio.id, cost);
                const updatedClient = await rbcApi.getClient(client.id);
                setClient(updatedClient);
                console.log('🤖 AI API sync successful');
              } catch (apiErr) {
                console.warn('🤖 AI API sync failed, using local simulation:', apiErr);
              }
            }
          } else {
            // Try to withdraw (simulating selling stocks)
            if (portfolio.current_value > 100) {
              const withdrawAmount = Math.random() * 500 + 100;
              
              console.log('🤖 AI attempting to sell:', { withdrawAmount, portfolioValue: portfolio.current_value });
              
              if (portfolio.current_value >= withdrawAmount) {
                // Simulate AI trade locally first
                const newClientCash = client.cash + withdrawAmount;
                const newPortfolioValue = portfolio.current_value - withdrawAmount;
                
                setClient(prev => ({ ...prev, cash: newClientCash }));
                setPortfolio(prev => ({ ...prev, current_value: newPortfolioValue }));
                setCurrentValue(newPortfolioValue);
                
                // Record AI trade
                const newTrade: AITrade = {
                  id: `${Date.now()}-${Math.random()}`,
                  action: 'SELL',
                  stock: 'PORTFOLIO',
                  shares: Math.floor(withdrawAmount / 100),
                  price: withdrawAmount,
                  timestamp: Date.now()
                };
                
                setAiTrades(prev => [...prev, newTrade]);
                console.log('🤖 AI sold portfolio:', newTrade);
                
                // Try API sync
                try {
                  await rbcApi.withdrawFromPortfolio(portfolio.id, withdrawAmount);
                  const updatedClient = await rbcApi.getClient(client.id);
                  setClient(updatedClient);
                  console.log('🤖 AI API sync successful');
                } catch (apiErr) {
                  console.warn('🤖 AI API sync failed, using local simulation:', apiErr);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('🤖 AI trading error:', err);
      }
    }, 3000);

    return () => clearInterval(aiTradeInterval);
  }, [isAITurn, timeLeft, gameComplete, portfolio, client, stocks]);

  const handleEventTrigger = useCallback((impact: 'positive' | 'negative' | 'neutral') => {
    const multiplier = impact === 'positive' ? 1.05 : impact === 'negative' ? 0.95 : 1;
    console.log('⚡ Market event triggered:', { impact, multiplier });
    setStocks(prevStocks => {
      const updatedStocks = prevStocks.map(stock => {
        const newPrice = stock.price * multiplier;
        console.log(`⚡ ${stock.symbol}: $${stock.price.toFixed(2)} → $${newPrice.toFixed(2)} (${impact} event)`);
        return {
          ...stock,
          price: newPrice
        };
      });
      return updatedStocks;
    });
  }, []);

  const buyStock = async (stock: Stock) => {
    if (!portfolio || !client || isTrading) return;
    
    try {
      setIsTrading(true);
      const cost = stock.price;
      console.log('Attempting to buy stock:', { stock: stock.symbol, cost, clientCash: client.cash, portfolioId: portfolio.id });
      
      if (client.cash >= cost) {
        // For now, let's simulate the trade locally and then sync with the API
        // This avoids API issues while still using the portfolio system
        
        // Simulate the trade locally first
        const newClientCash = client.cash - cost;
        const newPortfolioValue = portfolio.current_value + cost;
        
        // Update local state immediately for better UX
        console.log('💰 Updating local state after buy:', { 
          oldCash: client.cash, 
          newCash: newClientCash, 
          oldPortfolio: portfolio.current_value, 
          newPortfolio: newPortfolioValue 
        });
        setClient(prev => ({ ...prev, cash: newClientCash }));
        setPortfolio(prev => ({ ...prev, current_value: newPortfolioValue }));
        setCurrentValue(newPortfolioValue);
        
        // Try to sync with API (but don't fail if it doesn't work)
        try {
          const result = await rbcApi.transferToPortfolio(portfolio.id, cost);
          console.log('API sync successful:', result);
          // Update with actual API response
          setClient(prev => ({ ...prev, cash: result.client_cash }));
          setPortfolio(result.portfolio);
          setCurrentValue(result.portfolio.current_value);
        } catch (apiErr) {
          console.warn('API sync failed, using local simulation:', apiErr);
          // Keep the local simulation - the trade still works
        }
        
        console.log(`Successfully bought ${stock.symbol} for $${cost}`);
        setSuccessMessage(`✅ Bought ${stock.symbol} for $${cost.toFixed(2)}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.log('Not enough cash to buy stock');
        setError(`Not enough cash! Need $${cost}, have $${client.cash}`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Failed to buy stock - Full error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to buy stock: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsTrading(false);
    }
  };

  const sellStock = async (stock: Stock) => {
    if (!portfolio || !client || isTrading) return;
    
    try {
      setIsTrading(true);
      const sellValue = stock.price;
      console.log('Attempting to sell stock:', { stock: stock.symbol, sellValue, portfolioValue: portfolio.current_value, portfolioId: portfolio.id });
      
      if (portfolio.current_value >= sellValue) {
        // Simulate the trade locally first
        const newClientCash = client.cash + sellValue;
        const newPortfolioValue = portfolio.current_value - sellValue;
        
        // Update local state immediately for better UX
        console.log('💰 Updating local state after sell:', { 
          oldCash: client.cash, 
          newCash: newClientCash, 
          oldPortfolio: portfolio.current_value, 
          newPortfolio: newPortfolioValue 
        });
        setClient(prev => ({ ...prev, cash: newClientCash }));
        setPortfolio(prev => ({ ...prev, current_value: newPortfolioValue }));
        setCurrentValue(newPortfolioValue);
        
        // Try to sync with API (but don't fail if it doesn't work)
        try {
          const result = await rbcApi.withdrawFromPortfolio(portfolio.id, sellValue);
          console.log('API sync successful:', result);
          // Update with actual API response
          setClient(prev => ({ ...prev, cash: result.client_cash }));
          setPortfolio(result.portfolio);
          setCurrentValue(result.portfolio.current_value);
        } catch (apiErr) {
          console.warn('API sync failed, using local simulation:', apiErr);
          // Keep the local simulation - the trade still works
        }
        
        console.log(`Successfully sold ${stock.symbol} for $${sellValue}`);
        setSuccessMessage(`✅ Sold ${stock.symbol} for $${sellValue.toFixed(2)}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.log('Not enough portfolio value to sell');
        setError(`Not enough portfolio value! Need $${sellValue}, have $${portfolio.current_value}`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Failed to sell stock - Full error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to sell stock: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsTrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{backgroundColor: '#061625'}}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          ⚡
        </motion.div>
        <div className="ml-4 text-2xl neon-blue">
          {isAITurn ? 'AI Initializing...' : 'Initializing Battle...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{backgroundColor: '#061625'}}>
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl text-red-400 mb-6">{error}</div>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-6 py-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-300 transition-colors"
            >
              🔄 Retry Game
            </button>
            <button 
              onClick={() => {
                setError('');
                setIsLoading(true);
                // Retry initialization
                window.location.reload();
              }} 
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-400 transition-colors"
            >
              🔧 Reset & Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!client || !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{backgroundColor: '#061625'}}>
        <div className="text-2xl neon-blue">Loading game data...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <NewsTicker />
      <CharacterPopup onEventTrigger={handleEventTrigger} />
      
      {/* Goal Progress Indicator */}
      <div className="absolute top-4 right-4 z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-black/80 border-2 border-yellow-400 rounded-lg p-4"
        >
          <div className="text-yellow-400 font-bold text-sm mb-2">GOAL PROGRESS</div>
          <div className="text-white text-lg font-bold">
            ${currentValue.toLocaleString()} / ${gameConfig.cost.toLocaleString()}
          </div>
          <div className="w-32 h-2 bg-gray-700 rounded-full mt-2">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (currentValue / gameConfig.cost) * 100)}%` }}
            />
          </div>
          {goalReached && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-400 font-bold text-sm mt-2"
            >
              🎯 GOAL REACHED!
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Time Progress Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-black/80 border-2 border-blue-400 rounded-lg p-4"
        >
          <div className="text-blue-400 font-bold text-sm mb-2">TIME REMAINING</div>
          <div className="text-white text-2xl font-bold">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="w-40 h-2 bg-gray-700 rounded-full mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                timeLeft > totalTime * 0.5 ? 'bg-green-400' : 
                timeLeft > totalTime * 0.25 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${(timeLeft / totalTime) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {Math.round((totalTime - timeLeft) / totalTime * 100)}% Complete
          </div>
        </motion.div>
      </div>

      <PortfolioView
        portfolio={{ 'PORTFOLIO': portfolio.current_value }}
        stocks={stocks}
        cash={client.cash}
        totalValue={currentValue}
        timeLeft={timeLeft}
        totalTime={totalTime}
        startValue={gameConfig.initialCash}
        isAITurn={isAITurn}
        onTrade={() => setShowTradingModal(true)}
      />

      <TradingModal
        isOpen={showTradingModal && !isAITurn}
        onClose={() => setShowTradingModal(false)}
        stocks={stocks}
        portfolio={{ [portfolio.type]: portfolio.current_value }}
        cash={client.cash}
        chartData={chartData}
        selectedStock={selectedStock}
        onSelectStock={setSelectedStock}
        onBuy={buyStock}
        onSell={sellStock}
        isTrading={isTrading}
      />

      {isAITurn && (
        <AITradingFeed
          trades={aiTrades}
          currentValue={currentValue}
          startValue={gameConfig.initialCash}
        />
      )}

      {/* Round Info */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-black/80 border-2 border-blue-400 rounded-lg p-4">
          <div className="text-blue-400 font-bold text-sm">ROUND {roundNumber}</div>
          <div className="text-white text-lg font-bold">
            {isAITurn ? '🤖 AI TURN' : '👤 YOUR TURN'}
          </div>
          <div className="text-gray-300 text-sm">
            Goal: {gameConfig.goal}
          </div>
          {isTrading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-yellow-400 text-sm mt-2"
            >
              ⚡ Processing trade...
            </motion.div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-red-900/90 border-2 border-red-400 rounded-lg p-4 max-w-md"
          >
            <div className="text-red-400 font-bold text-center">{error}</div>
          </motion.div>
        </div>
      )}

      {/* Success Display */}
      {successMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-green-900/90 border-2 border-green-400 rounded-lg p-4 max-w-md"
          >
            <div className="text-green-400 font-bold text-center">{successMessage}</div>
          </motion.div>
        </div>
      )}

      {/* Trading Instructions */}
      {!isAITurn && !showTradingModal && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2 }}
            className="bg-black/80 border-2 border-green-400 rounded-lg p-4 max-w-md"
          >
            <div className="text-green-400 font-bold text-sm text-center">
              💡 Click "TRADE" to buy/sell stocks and reach your goal!
            </div>
          </motion.div>
        </div>
      )}

      {/* Debug Panel - Remove this in production */}
      {client && portfolio && (
        <div className="absolute bottom-4 right-4 z-50">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-black/90 border-2 border-purple-400 rounded-lg p-4 text-xs max-w-xs"
          >
            <div className="text-purple-400 font-bold mb-3">🔍 DEBUG INFO</div>
            <div className="text-white space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>Cash:</div>
                <div className="text-green-400">${client.cash.toFixed(2)}</div>
                <div>Portfolio:</div>
                <div className="text-blue-400">${portfolio.current_value.toFixed(2)}</div>
                <div>Total:</div>
                <div className="text-yellow-400">${currentValue.toFixed(2)}</div>
                <div>Goal:</div>
                <div className="text-pink-400">${gameConfig.cost.toFixed(2)}</div>
              </div>
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div>Time: {timeLeft}s / {totalTime}s</div>
                <div>Turn: {isAITurn ? '🤖 AI' : '👤 Player'}</div>
                <div>Round: {roundNumber}</div>
                <div>Status: {gameComplete ? '🏁 Complete' : isTrading ? '⚡ Trading' : '▶️ Active'}</div>
              </div>
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div>Portfolio ID: {portfolio.id.substring(0, 12)}...</div>
                <div>Client ID: {client.id.substring(0, 12)}...</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

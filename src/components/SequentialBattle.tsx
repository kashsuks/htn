import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { groqStockMarket, StockMarketData, MarketConditions } from '../services/groqStockMarket';

interface SequentialBattleProps {
  timeFrame: number; // Days
  initialCash: number;
  onComplete: (results: BattleResults) => void;
}

interface BattleResults {
  human: {
    finalValue: number;
    totalReturn: number;
    trades: Trade[];
  };
  autonomousAI: {
    finalValue: number;
    totalReturn: number;
    trades: Trade[];
  };
  investEase: {
    finalValue: number;
    totalReturn: number;
    strategy: string;
  };
  winner: 'human' | 'autonomousAI' | 'investEase';
  marketData: StockMarketData[];
}

interface Trade {
  id: string;
  action: 'buy' | 'sell';
  symbol: string;
  shares: number;
  price: number;
  timestamp: number;
  reasoning?: string;
}

type BattlePhase = 'human' | 'autonomousAI' | 'investEase' | 'results';

export function SequentialBattle({ timeFrame, initialCash, onComplete }: SequentialBattleProps) {
  // Market state
  const [stocks, setStocks] = useState<StockMarketData[]>([]);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Battle phase
  const [battlePhase, setBattlePhase] = useState<BattlePhase>('human');
  const [currentPhase, setCurrentPhase] = useState(1);
  const [totalPhases] = useState(3);

  // Human player state
  const [humanCash, setHumanCash] = useState(initialCash);
  const [humanPortfolio, setHumanPortfolio] = useState<{[key: string]: number}>({});
  const [humanTrades, setHumanTrades] = useState<Trade[]>([]);
  const [humanValue, setHumanValue] = useState(initialCash);

  // Autonomous AI state
  const [aiCash, setAiCash] = useState(initialCash);
  const [aiPortfolio, setAiPortfolio] = useState<{[key: string]: number}>({});
  const [aiTrades, setAiTrades] = useState<Trade[]>([]);
  const [aiValue, setAiValue] = useState(initialCash);

  // InvestEase simulator state
  const [investEaseValue, setInvestEaseValue] = useState(initialCash);
  const [investEaseStrategy, setInvestEaseStrategy] = useState<string>('');

  // Game state
  const [timeLeft, setTimeLeft] = useState(timeFrame * 5); // 5 seconds per day
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockMarketData | null>(null);

  // Initialize market
  useEffect(() => {
    const initializeMarket = async () => {
      try {
        console.log('🏗️ Initializing sequential battle market...');
        await groqStockMarket.initialize(timeFrame);
        
        const initialStocks = groqStockMarket.getCurrentStocks();
        const conditions = groqStockMarket.getMarketConditions();
        
        setStocks(initialStocks);
        setMarketConditions(conditions);
        setSelectedStock(initialStocks[0] || null);
        setIsInitialized(true);
        
        console.log('✅ Market initialized with', initialStocks.length, 'stocks');
      } catch (error) {
        console.error('❌ Failed to initialize market:', error);
      }
    };

    initializeMarket();
  }, [timeFrame]);

  // Daily market updates
  useEffect(() => {
    if (!isInitialized || gameComplete) return;

    const interval = setInterval(async () => {
      try {
        const newDay = Math.min(currentDay + 1, timeFrame);
        setCurrentDay(newDay);
        
        console.log(`📅 Day ${newDay}/${timeFrame} - Updating market...`);
        
        // Update market data
        const updatedStocks = await groqStockMarket.updateMarket(newDay);
        setStocks(updatedStocks);
        
        // Update portfolio values
        updatePortfolioValues(updatedStocks);
        
        console.log(`📊 Market updated for day ${newDay}`);
        
      } catch (error) {
        console.error('Failed to update market:', error);
      }
    }, 5000); // 5 seconds per day

    return () => clearInterval(interval);
  }, [isInitialized, currentDay, timeFrame, gameComplete]);

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

  // Update portfolio values
  const updatePortfolioValues = useCallback((currentStocks: StockMarketData[]) => {
    // Update human portfolio value
    const humanStockValue = Object.entries(humanPortfolio).reduce((total, [symbol, shares]) => {
      const stock = currentStocks.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * shares : 0);
    }, 0);
    setHumanValue(humanCash + humanStockValue);

    // Update AI portfolio value
    const aiStockValue = Object.entries(aiPortfolio).reduce((total, [symbol, shares]) => {
      const stock = currentStocks.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * shares : 0);
    }, 0);
    setAiValue(aiCash + aiStockValue);
  }, [humanPortfolio, aiPortfolio, humanCash, aiCash]);

  // Human trading functions
  const buyStock = useCallback((stock: StockMarketData, shares: number = 1) => {
    const tradeValue = stock.price * shares;
    
    if (humanCash >= tradeValue) {
      setHumanCash(prev => prev - tradeValue);
      setHumanPortfolio(prev => ({
        ...prev,
        [stock.symbol]: (prev[stock.symbol] || 0) + shares
      }));
      
      const trade: Trade = {
        id: `human-${Date.now()}`,
        action: 'buy',
        symbol: stock.symbol,
        shares: shares,
        price: stock.price,
        timestamp: Date.now()
      };
      
      setHumanTrades(prev => [...prev, trade]);
      console.log('👤 Human Trade:', trade);
    }
  }, [humanCash]);

  const sellStock = useCallback((stock: StockMarketData, shares: number = 1) => {
    if (humanPortfolio[stock.symbol] >= shares) {
      const tradeValue = stock.price * shares;
      
      setHumanCash(prev => prev + tradeValue);
      setHumanPortfolio(prev => ({
        ...prev,
        [stock.symbol]: prev[stock.symbol] - shares
      }));
      
      const trade: Trade = {
        id: `human-${Date.now()}`,
        action: 'sell',
        symbol: stock.symbol,
        shares: shares,
        price: stock.price,
        timestamp: Date.now()
      };
      
      setHumanTrades(prev => [...prev, trade]);
      console.log('👤 Human Trade:', trade);
    }
  }, [humanPortfolio]);

  // Autonomous AI trading
  const executeAITrade = useCallback(async (currentStocks: StockMarketData[]) => {
    try {
      const aiDecision = await groqStockMarket.generateAIDecision(currentStocks, aiPortfolio, aiCash);
      
      if (aiDecision.action === 'hold') return;

      const stock = currentStocks.find(s => s.symbol === aiDecision.symbol);
      if (!stock) return;

      const tradeValue = stock.price * aiDecision.shares;

      if (aiDecision.action === 'buy' && aiCash >= tradeValue) {
        setAiCash(prev => prev - tradeValue);
        setAiPortfolio(prev => ({
          ...prev,
          [aiDecision.symbol]: (prev[aiDecision.symbol] || 0) + aiDecision.shares
        }));
        
        const trade: Trade = {
          id: `ai-${Date.now()}`,
          action: 'buy',
          symbol: aiDecision.symbol,
          shares: aiDecision.shares,
          price: stock.price,
          timestamp: Date.now(),
          reasoning: aiDecision.reasoning
        };
        
        setAiTrades(prev => [...prev, trade]);
        console.log('🤖 AI Trade:', trade);
        
      } else if (aiDecision.action === 'sell' && aiPortfolio[aiDecision.symbol] >= aiDecision.shares) {
        setAiCash(prev => prev + tradeValue);
        setAiPortfolio(prev => ({
          ...prev,
          [aiDecision.symbol]: prev[aiDecision.symbol] - aiDecision.shares
        }));
        
        const trade: Trade = {
          id: `ai-${Date.now()}`,
          action: 'sell',
          symbol: aiDecision.symbol,
          shares: aiDecision.shares,
          price: stock.price,
          timestamp: Date.now(),
          reasoning: aiDecision.reasoning
        };
        
        setAiTrades(prev => [...prev, trade]);
        console.log('🤖 AI Trade:', trade);
      }
    } catch (error) {
      console.error('Failed to execute AI trade:', error);
    }
  }, [aiCash, aiPortfolio]);

  // Phase completion handlers
  const handleHumanComplete = () => {
    console.log('👤 Human phase complete');
    setBattlePhase('autonomousAI');
    setCurrentPhase(2);
  };

  const handleAIPhaseComplete = () => {
    console.log('🤖 AI phase complete');
    setBattlePhase('investEase');
    setCurrentPhase(3);
  };

  const handleInvestEaseComplete = () => {
    console.log('🏦 InvestEase phase complete');
    setBattlePhase('results');
  };

  // Complete game and determine winner
  useEffect(() => {
    if (!gameComplete) return;

    const humanReturn = ((humanValue - initialCash) / initialCash) * 100;
    const aiReturn = ((aiValue - initialCash) / initialCash) * 100;
    const investEaseReturn = ((investEaseValue - initialCash) / initialCash) * 100;

    let winner: 'human' | 'autonomousAI' | 'investEase' = 'human';
    if (aiValue > humanValue && aiValue > investEaseValue) {
      winner = 'autonomousAI';
    } else if (investEaseValue > humanValue && investEaseValue > aiValue) {
      winner = 'investEase';
    }

    const results: BattleResults = {
      human: {
        finalValue: humanValue,
        totalReturn: humanReturn,
        trades: humanTrades
      },
      autonomousAI: {
        finalValue: aiValue,
        totalReturn: aiReturn,
        trades: aiTrades
      },
      investEase: {
        finalValue: investEaseValue,
        totalReturn: investEaseReturn,
        strategy: investEaseStrategy
      },
      winner,
      marketData: stocks
    };

    console.log('🏆 Battle Results:', results);
    onComplete(results);
  }, [gameComplete, humanValue, aiValue, investEaseValue, humanTrades, aiTrades, investEaseStrategy, stocks, initialCash, onComplete]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-2xl">Initializing Market...</div>
        </div>
      </div>
    );
  }

  // Human Phase
  if (battlePhase === 'human') {
    return (
      <div className="min-h-screen text-white p-6" style={{backgroundColor: '#061625'}}>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl neon-green mb-4"
          >
            👤 HUMAN TRADER
          </motion.div>
          
          <div className="text-2xl neon-cyan mb-2">
            📅 DAY {currentDay} of {timeFrame}
          </div>
          
          <div className="text-lg text-white mb-4">
            Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Portfolio Display */}
        <div className="mb-8 p-6 border-2 neon-border-green rounded-lg" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
          <h3 className="text-xl neon-green mb-4">💰 YOUR PORTFOLIO</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">${humanValue.toFixed(2)}</div>
              <div className="text-sm text-white">Total Value</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">${humanCash.toFixed(2)}</div>
              <div className="text-sm text-white">Cash</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">${(humanValue - humanCash).toFixed(2)}</div>
              <div className="text-sm text-white">Stocks</div>
            </div>
          </div>
        </div>

        {/* Stock Market */}
        <div className="mb-8">
          <h3 className="text-xl neon-cyan mb-4">📈 STOCK MARKET</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <motion.div
                key={stock.symbol}
                whileHover={{ scale: 1.02 }}
                className="border-2 neon-border-cyan p-4 rounded-lg cursor-pointer"
                style={{backgroundColor: 'rgba(0, 255, 255, 0.1)'}}
                onClick={() => setSelectedStock(stock)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="neon-cyan font-bold">{stock.symbol}</div>
                    <div className="text-sm text-white">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">${stock.price.toFixed(2)}</div>
                    <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trading Interface */}
        {selectedStock && (
          <div className="mb-8 p-6 border-2 neon-border-pink rounded-lg" style={{backgroundColor: 'rgba(255, 0, 233, 0.1)'}}>
            <h3 className="text-xl neon-pink mb-4">💰 TRADING: {selectedStock.symbol}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-white mb-2">Current Price: ${selectedStock.price.toFixed(2)}</div>
                <div className="text-white mb-2">Change: {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%</div>
                <div className="text-white mb-2">Volume: {selectedStock.volume.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-white mb-2">Your Shares: {humanPortfolio[selectedStock.symbol] || 0}</div>
                <div className="text-white mb-2">Value: ${((humanPortfolio[selectedStock.symbol] || 0) * selectedStock.price).toFixed(2)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => buyStock(selectedStock, 1)}
                  disabled={humanCash < selectedStock.price}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Buy 1
                </button>
                <button
                  onClick={() => sellStock(selectedStock, 1)}
                  disabled={(humanPortfolio[selectedStock.symbol] || 0) < 1}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Sell 1
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={handleHumanComplete}
            className="border-4 neon-border-yellow text-black pixel-font text-2xl px-8 py-4 bg-yellow-400 hover:bg-yellow-300 transition-all duration-300"
          >
            ✅ COMPLETE HUMAN PHASE
          </button>
        </div>
      </div>
    );
  }

  // Autonomous AI Phase
  if (battlePhase === 'autonomousAI') {
    return (
      <div className="min-h-screen text-white p-6" style={{backgroundColor: '#061625'}}>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl neon-purple mb-4"
          >
            🤖 AUTONOMOUS AI
          </motion.div>
          
          <div className="text-2xl neon-cyan mb-2">
            📅 DAY {currentDay} of {timeFrame}
          </div>
          
          <div className="text-lg text-white mb-4">
            Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* AI Portfolio Display */}
        <div className="mb-8 p-6 border-2 neon-border-purple rounded-lg" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
          <h3 className="text-xl neon-purple mb-4">🤖 AI PORTFOLIO</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">${aiValue.toFixed(2)}</div>
              <div className="text-sm text-white">Total Value</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">${aiCash.toFixed(2)}</div>
              <div className="text-sm text-white">Cash</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">${(aiValue - aiCash).toFixed(2)}</div>
              <div className="text-sm text-white">Stocks</div>
            </div>
          </div>
        </div>

        {/* AI Trading Activity */}
        <div className="mb-8 p-6 border-2 neon-border-blue rounded-lg" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
          <h3 className="text-xl neon-blue mb-4">🤖 AI TRADING ACTIVITY</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {aiTrades.slice(-5).map((trade) => (
              <div key={trade.id} className="text-sm text-white">
                {trade.action.toUpperCase()} {trade.shares} {trade.symbol} @ ${trade.price.toFixed(2)}
                {trade.reasoning && <div className="text-xs text-gray-400">{trade.reasoning}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={handleAIPhaseComplete}
            className="border-4 neon-border-yellow text-black pixel-font text-2xl px-8 py-4 bg-yellow-400 hover:bg-yellow-300 transition-all duration-300"
          >
            ✅ COMPLETE AI PHASE
          </button>
        </div>
      </div>
    );
  }

  // InvestEase Phase
  if (battlePhase === 'investEase') {
    return (
      <div className="min-h-screen text-white p-6" style={{backgroundColor: '#061625'}}>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl neon-yellow mb-4"
          >
            🏦 INVESTEASE AI
          </motion.div>
          
          <div className="text-2xl neon-cyan mb-2">
            📅 DAY {currentDay} of {timeFrame}
          </div>
          
          <div className="text-lg text-white mb-4">
            Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* InvestEase Portfolio Display */}
        <div className="mb-8 p-6 border-2 neon-border-yellow rounded-lg" style={{backgroundColor: 'rgba(255, 255, 0, 0.1)'}}>
          <h3 className="text-xl neon-yellow mb-4">🏦 INVESTEASE PORTFOLIO</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">${investEaseValue.toFixed(2)}</div>
              <div className="text-sm text-white">Total Value</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">${investEaseStrategy || 'Loading...'}</div>
              <div className="text-sm text-white">Strategy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Professional</div>
              <div className="text-sm text-white">AI Service</div>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={handleInvestEaseComplete}
            className="border-4 neon-border-yellow text-black pixel-font text-2xl px-8 py-4 bg-yellow-400 hover:bg-yellow-300 transition-all duration-300"
          >
            ✅ COMPLETE INVESTEASE PHASE
          </button>
        </div>
      </div>
    );
  }

  return null;
}

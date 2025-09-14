import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { groqStockMarket, StockMarketData, MarketConditions } from '../services/groqStockMarket';

interface ThreeWayBattleProps {
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

export function ThreeWayBattle({ timeFrame, initialCash, onComplete }: ThreeWayBattleProps) {
  // Market state
  const [stocks, setStocks] = useState<StockMarketData[]>([]);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Human player state
  const [humanCash, setHumanCash] = useState(initialCash);
  const [humanPortfolio, setHumanPortfolio] = useState<{[key: string]: number}>({});
  const [humanTrades, setHumanTrades] = useState<Trade[]>([]);

  // Autonomous AI state
  const [aiCash, setAiCash] = useState(initialCash);
  const [aiPortfolio, setAiPortfolio] = useState<{[key: string]: number}>({});
  const [aiTrades, setAiTrades] = useState<Trade[]>([]);

  // InvestEase simulator state
  const [investEaseValue, setInvestEaseValue] = useState(initialCash);
  const [investEaseStrategy, setInvestEaseStrategy] = useState<string>('');

  // Game state
  const [timeLeft, setTimeLeft] = useState(timeFrame * 5); // 5 seconds per day
  const [gameComplete, setGameComplete] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockMarketData | null>(null);

  // Initialize market
  useEffect(() => {
    const initializeMarket = async () => {
      try {
        console.log('🏗️ Initializing three-way battle market...');
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
        
        // Generate autonomous AI decision
        const aiDecision = await groqStockMarket.generateAIDecision(updatedStocks, aiPortfolio, aiCash);
        executeAITrade(aiDecision, updatedStocks);
        
        // Update InvestEase performance using RBC API
        if (newDay === timeFrame) {
          try {
            const token = localStorage.getItem('game_token');
            if (token) {
              // Use RBC API for InvestEase simulation
              const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/rbc/client/simulate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  months: Math.ceil(timeFrame / 30),
                  token: token
                })
              });

              if (response.ok) {
                const simulationData = await response.json();
                if (simulationData.results && simulationData.results.length > 0) {
                  const result = simulationData.results[0];
                  setInvestEaseValue(result.projectedValue || result.endingValue || initialCash);
                  setInvestEaseStrategy(result.strategy || 'RBC InvestEase AI Portfolio Management');
                }
              }
            }
          } catch (error) {
            console.warn('Failed to get RBC InvestEase simulation, using fallback:', error);
            // Fallback to Groq if RBC fails
            const investEasePerf = await groqStockMarket.generateInvestEasePerformance(initialCash, timeFrame);
            setInvestEaseValue(investEasePerf.finalValue);
            setInvestEaseStrategy(investEasePerf.strategy);
          }
        }
        
        console.log(`📊 Market updated for day ${newDay}`);
        
      } catch (error) {
        console.error('Failed to update market:', error);
      }
    }, 5000); // 5 seconds per day

    return () => clearInterval(interval);
  }, [isInitialized, currentDay, timeFrame, gameComplete, aiPortfolio, aiCash]);

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

  // Execute autonomous AI trade
  const executeAITrade = useCallback((decision: any, currentStocks: StockMarketData[]) => {
    if (decision.action === 'hold') return;

    const stock = currentStocks.find(s => s.symbol === decision.symbol);
    if (!stock) return;

    const tradeValue = stock.price * decision.shares;

    if (decision.action === 'buy' && aiCash >= tradeValue) {
      setAiCash(prev => prev - tradeValue);
      setAiPortfolio(prev => ({
        ...prev,
        [decision.symbol]: (prev[decision.symbol] || 0) + decision.shares
      }));
      
      const trade: Trade = {
        id: `ai-${Date.now()}`,
        action: 'buy',
        symbol: decision.symbol,
        shares: decision.shares,
        price: stock.price,
        timestamp: Date.now(),
        reasoning: decision.reasoning
      };
      
      setAiTrades(prev => [...prev, trade]);
      console.log('🤖 AI Trade:', trade);
      
    } else if (decision.action === 'sell' && aiPortfolio[decision.symbol] >= decision.shares) {
      setAiCash(prev => prev + tradeValue);
      setAiPortfolio(prev => ({
        ...prev,
        [decision.symbol]: prev[decision.symbol] - decision.shares
      }));
      
      const trade: Trade = {
        id: `ai-${Date.now()}`,
        action: 'sell',
        symbol: decision.symbol,
        shares: decision.shares,
        price: stock.price,
        timestamp: Date.now(),
        reasoning: decision.reasoning
      };
      
      setAiTrades(prev => [...prev, trade]);
      console.log('🤖 AI Trade:', trade);
    }
  }, [aiCash, aiPortfolio]);

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

  // Calculate portfolio values
  const calculatePortfolioValue = useCallback((portfolio: {[key: string]: number}, cash: number) => {
    const stockValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * shares : 0);
    }, 0);
    return cash + stockValue;
  }, [stocks]);

  const humanValue = calculatePortfolioValue(humanPortfolio, humanCash);
  const aiValue = calculatePortfolioValue(aiPortfolio, aiCash);

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

  return (
    <div className="min-h-screen text-white p-6" style={{backgroundColor: '#061625'}}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl neon-pink mb-4"
        >
          🏆 THREE-WAY BATTLE
        </motion.div>
        
        <div className="text-2xl neon-cyan mb-2">
          📅 DAY {currentDay} of {timeFrame}
        </div>
        
        <div className="text-lg text-white mb-4">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Market Overview */}
      {marketConditions && (
        <div className="mb-8 p-6 border-2 neon-border-blue rounded-lg" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
          <h3 className="text-xl neon-blue mb-4">📊 MARKET CONDITIONS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-300">Trend</div>
              <div className="text-white capitalize">{marketConditions.overallTrend}</div>
            </div>
            <div>
              <div className="text-blue-300">Volatility</div>
              <div className="text-white">{(marketConditions.volatility * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-blue-300">Inflation</div>
              <div className="text-white">{marketConditions.economicIndicators.inflation}%</div>
            </div>
            <div>
              <div className="text-blue-300">Interest Rate</div>
              <div className="text-white">{marketConditions.economicIndicators.interestRate}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Competitors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Human Player */}
        <div className="border-2 neon-border-green p-6 rounded-lg" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
          <h3 className="text-xl neon-green mb-4">👤 HUMAN TRADER</h3>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">${humanValue.toFixed(2)}</div>
            <div className="text-sm text-white">
              Cash: ${humanCash.toFixed(2)} | Stocks: ${(humanValue - humanCash).toFixed(2)}
            </div>
            <div className="text-sm text-white">
              Return: {(((humanValue - initialCash) / initialCash) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-white">
              Trades: {humanTrades.length}
            </div>
          </div>
        </div>

        {/* Autonomous AI */}
        <div className="border-2 neon-border-purple p-6 rounded-lg" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
          <h3 className="text-xl neon-purple mb-4">🤖 AUTONOMOUS AI</h3>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">${aiValue.toFixed(2)}</div>
            <div className="text-sm text-white">
              Cash: ${aiCash.toFixed(2)} | Stocks: ${(aiValue - aiCash).toFixed(2)}
            </div>
            <div className="text-sm text-white">
              Return: {(((aiValue - initialCash) / initialCash) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-white">
              Trades: {aiTrades.length}
            </div>
          </div>
        </div>

        {/* InvestEase Simulator */}
        <div className="border-2 neon-border-yellow p-6 rounded-lg" style={{backgroundColor: 'rgba(255, 255, 0, 0.1)'}}>
          <h3 className="text-xl neon-yellow mb-4">🏦 INVESTEASE AI</h3>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">${investEaseValue.toFixed(2)}</div>
            <div className="text-sm text-white">
              Strategy: {investEaseStrategy || 'Loading...'}
            </div>
            <div className="text-sm text-white">
              Return: {(((investEaseValue - initialCash) / initialCash) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-white">
              Status: {currentDay === timeFrame ? 'Complete' : 'Simulating...'}
            </div>
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

      {/* Recent Trades */}
      <div className="mb-8">
        <h3 className="text-xl neon-orange mb-4">📋 RECENT TRADES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-lg text-green-400 mb-2">Human Trades</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {humanTrades.slice(-5).map((trade) => (
                <div key={trade.id} className="text-sm text-white">
                  {trade.action.toUpperCase()} {trade.shares} {trade.symbol} @ ${trade.price.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg text-purple-400 mb-2">AI Trades</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {aiTrades.slice(-5).map((trade) => (
                <div key={trade.id} className="text-sm text-white">
                  {trade.action.toUpperCase()} {trade.shares} {trade.symbol} @ ${trade.price.toFixed(2)}
                  {trade.reasoning && <div className="text-xs text-gray-400">{trade.reasoning}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

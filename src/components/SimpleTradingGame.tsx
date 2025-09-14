import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthContext } from '../contexts/AuthContext';
import { GameConfig } from './GameSetup';
import GroqTradingAnalysisService, { TradingDecision, SimulationData } from '../services/groqAnalysis';
import { stockClientService, STOCK_DEFINITIONS, StockPrediction } from '../services/stockClientService';
import { PortfolioView } from './PortfolioView';
import { TradingModal } from './TradingModal';
import { CharacterPopup } from './CharacterPopup';
import { AITradingFeed } from './AITradingFeed';
import { gameApi, Client, Portfolio } from '../services/gameApi';

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

interface SimpleTradingGameProps {
  gameConfig: GameConfig;
  isAITurn: boolean;
  onComplete: (score: number) => void;
  roundNumber: number;
  timeFrame?: number; // Time frame for predictions in days
}


export function SimpleTradingGame({ gameConfig, isAITurn, onComplete, roundNumber, timeFrame = 7 }: SimpleTradingGameProps) {
  const { getAccessTokenSilently } = useAuth0();
  const { updateGameStats } = useAuthContext();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[]>([]);
  const [stockClientsInitialized, setStockClientsInitialized] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [chartData, setChartData] = useState<StockData[]>([]);
  const [portfolio, setPortfolio] = useState<{[key: string]: number}>({});
  const [cash, setCash] = useState(gameConfig.initialCash);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime] = useState(30);
  const [totalValue, setTotalValue] = useState(gameConfig.initialCash);
  const [startValue] = useState(gameConfig.initialCash);
  const [gameComplete, setGameComplete] = useState(false);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [aiTrades, setAiTrades] = useState<AITrade[]>([]);
  
  // RBC InvestEase API state
  const [rbcClient, setRbcClient] = useState<Client | null>(null);
  const [rbcPortfolio, setRbcPortfolio] = useState<Portfolio | null>(null);
  const [rbcValue, setRbcValue] = useState(gameConfig.initialCash);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  
  // AI trading state - separate cash and portfolio
  const [aiCash, setAiCash] = useState(gameConfig.initialCash);
  const [aiPortfolio, setAiPortfolio] = useState<{[key: string]: number}>({});
  
  // Trading decision tracking for Groq analysis
  const [userDecisions, setUserDecisions] = useState<TradingDecision[]>([]);
  const [aiDecisions, setAiDecisions] = useState<TradingDecision[]>([]);
  const [roundStartTime] = useState(Date.now());
  const [groqAnalysis, setGroqAnalysis] = useState<GroqAnalysisResponse | null>(null);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Reset game state when round changes
  useEffect(() => {
    setTimeLeft(30);
    setGameComplete(false);
    setAiTrades([]);
    setRbcValue(gameConfig.initialCash);
    setTotalValue(gameConfig.initialCash);
    setCash(gameConfig.initialCash);
    setPortfolio({});
    setAiCash(gameConfig.initialCash);
    setAiPortfolio({});
    // Reset Groq analysis tracking
    setUserDecisions([]);
    setAiDecisions([]);
    setGroqAnalysis(null);
    setShowAnalysisReport(false);
    setAnalysisLoading(false);
    console.log('🔄 Round reset for round:', roundNumber, 'isAITurn:', isAITurn);
  }, [roundNumber, gameConfig.initialCash]); // Removed isAITurn dependency

  // Initialize stock clients and load predictions
  useEffect(() => {
    const initializeStockClients = async () => {
      if (stockClientsInitialized) return;
      
      try {
        console.log('🏗️ Initializing stock clients with timeFrame:', timeFrame);
        
        // Generate a team ID for this session
        const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Initialize stock clients
        await stockClientService.initialize(teamId);
        
        // Load initial stock data with predictions
        const predictions = await stockClientService.getAllPredictions(timeFrame);
        setStockPredictions(predictions);
        
        // Convert STOCK_DEFINITIONS to Stock objects with predictions
        const stocksWithPredictions = STOCK_DEFINITIONS.map(stockDef => {
          const prediction = predictions.find(p => p.symbol === stockDef.symbol);
          return {
            ...stockDef,
            prediction: prediction?.prediction || 0
          };
        });
        
        setStocks(stocksWithPredictions);
        if (stocksWithPredictions.length > 0) {
          setSelectedStock(stocksWithPredictions[0]);
        }
        setStockClientsInitialized(true);
        
        console.log('✅ Stock clients initialized with predictions:', predictions);
      } catch (error) {
        console.error('❌ Failed to initialize stock clients:', error);
        // Fallback to basic stock data without predictions
        const fallbackStocks = STOCK_DEFINITIONS.map(stockDef => ({
          ...stockDef,
          prediction: 0
        }));
        setStocks(fallbackStocks);
        if (fallbackStocks.length > 0) {
          setSelectedStock(fallbackStocks[0]);
        }
      }
    };
    
    initializeStockClients();
  }, [timeFrame, stockClientsInitialized]);
  
  // Initialize RBC InvestEase client and portfolio (legacy) - DISABLED
  // This legacy initialization is causing conflicts with the new stock-specific clients
  useEffect(() => {
    // Set fallback value for RBC since we're using stock-specific clients now
    setRbcValue(gameConfig.initialCash);
  }, [gameConfig]);

  // Initialize chart data
  useEffect(() => {
    if (!selectedStock) return;
    
    const initialData: StockData[] = [];
    for (let i = 0; i < 20; i++) {
      initialData.push({
        time: `${i}s`,
        price: selectedStock.price + (Math.random() - 0.5) * 10
      });
    }
    setChartData(initialData);
  }, [selectedStock]);

  // Update stock prices and chart
  useEffect(() => {
    if (timeLeft <= 0 || gameComplete) return;
    
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const change = (Math.random() - 0.5) * 5;
          return {
            ...stock,
            price: Math.max(10, stock.price + change),
            change: change
          };
        })
      );

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
  }, [timeLeft, gameComplete]);

  // Update total value periodically
  useEffect(() => {
    if (isAITurn) {
      // For AI turn: calculate total value from AI cash + AI portfolio
      const aiPortfolioValue = Object.entries(aiPortfolio).reduce((total, [symbol, shares]) => {
        const stock = stocks.find(s => s.symbol === symbol);
        return total + (stock ? stock.price * (shares as number) : 0);
      }, 0);
      setTotalValue(aiCash + aiPortfolioValue);
    } else {
      // For player turn: calculate total value from player cash + player portfolio
      const portfolioValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
        const stock = stocks.find(s => s.symbol === symbol);
        return total + (stock ? stock.price * (shares as number) : 0);
      }, 0);
      setTotalValue(cash + portfolioValue);
    }
  }, [cash, portfolio, stocks, isAITurn, aiCash, aiPortfolio]);

  // Timer countdown - Fixed to never freeze
  useEffect(() => {
    if (gameComplete) return;
    
    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        console.log('⏰ Timer tick:', prev);
        if (prev <= 1) {
          console.log('⏰ Time up! Completing round...');
          setGameComplete(true);
          setShowTradingModal(false);
          
          // Complete AI session if it's an AI turn
          if (isAITurn && aiSessionId) {
            gameApi.completeAITradingSession(aiSessionId, rbcValue).catch(console.error);
          }
          
          // We'll calculate final value in a separate effect when gameComplete changes
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [gameComplete, isAITurn, aiSessionId, rbcValue]);

  // Handle game completion and final value calculation
  useEffect(() => {
    if (!gameComplete) return;

    // Calculate final portfolio value with current state values
    let finalValue;
    if (isAITurn) {
      // For AI: calculate total value from AI cash + AI portfolio
      const aiPortfolioValue = Object.entries(aiPortfolio).reduce((total, [symbol, shares]) => {
        const stock = stocks.find(s => s.symbol === symbol);
        return total + (stock ? stock.price * (shares as number) : 0);
      }, 0);
      finalValue = aiCash + aiPortfolioValue;
      console.log('🤖 AI Final Value:', { aiCash, aiPortfolioValue, finalValue });
    } else {
      // For Player: use the already calculated totalValue
      finalValue = totalValue;
      console.log('👤 Player Final Value:', { cash, portfolioValue: totalValue - cash, finalValue });
    }
    
    // Save game session to MongoDB
    saveGameSession(finalValue);
    
    // Defer the onComplete call to avoid setState during render
    setTimeout(() => {
      onComplete(finalValue);
    }, 0);
  }, [gameComplete, isAITurn, aiCash, aiPortfolio, totalValue, cash, stocks, onComplete]);

  // Initialize AI trading session when AI turn starts
  useEffect(() => {
    if (!isAITurn || !rbcClient || !rbcPortfolio || aiSessionId) return;

    console.log('🤖 Starting AI session with:', { 
      isAITurn, 
      rbcClient: rbcClient?.id, 
      rbcPortfolio: rbcPortfolio?.id, 
      roundNumber 
    });

    const startAISession = async () => {
      try {
        const session = await gameApi.startAITradingSession(
          gameConfig,
          rbcClient.id,
          rbcPortfolio.id,
          roundNumber
        );
        setAiSessionId(session.sessionId);
        console.log('🤖 AI trading session started:', session.sessionId);
      } catch (error) {
        console.error('Failed to start AI trading session:', error);
      }
    };

    startAISession();
  }, [isAITurn, rbcClient, rbcPortfolio, aiSessionId, gameConfig, roundNumber]);

  // AI trading logic - Proper cash and portfolio management
  useEffect(() => {
    if (!isAITurn || gameComplete || stocks.length === 0) return;
    
    console.log('🤖 AI trading started for round:', roundNumber);
    
    let aiTradeInterval: NodeJS.Timeout;
    
    const rbcInvestEaseStrategy = async () => {
      try {
        console.log('🤖 AI executing trade...');
        
        // Pick a random stock to "buy"
        const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
        const sharesToBuy = Math.floor(Math.random() * 3) + 1; // 1-3 shares
        const tradeValue = randomStock.price * sharesToBuy;
        
        // Check if AI has enough cash
        setAiCash(prevCash => {
          if (prevCash >= tradeValue) {
            // AI can afford the trade
            const newCash = prevCash - tradeValue;
            
            // Update AI portfolio
            setAiPortfolio(prevPortfolio => {
              const newPortfolio = {
                ...prevPortfolio,
                [randomStock.symbol]: (prevPortfolio[randomStock.symbol] || 0) + sharesToBuy
              };
              
              // Calculate new total value
              const portfolioValue = Object.entries(newPortfolio).reduce((total, [symbol, shares]) => {
                const stock = stocks.find(s => s.symbol === symbol);
                return total + (stock ? stock.price * (shares as number) : 0);
              }, 0);
              
              const newTotalValue = newCash + portfolioValue;
              // Don't update rbcValue here, let it be calculated at the end
              
              // Record the trade
              const trade: AITrade = {
                id: `rbc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                action: 'BUY',
                stock: randomStock.symbol,
                shares: sharesToBuy,
                price: randomStock.price,
                timestamp: Date.now()
              };
              
              setAiTrades(prev => [...prev, trade]);
              console.log('🤖 AI trade executed:', trade, 'Cash left:', newCash, 'Total value:', newTotalValue);
              
              return newPortfolio;
            });
            
            return newCash;
          } else {
            console.log('🤖 AI not enough cash for trade:', prevCash, 'needed:', tradeValue);
            return prevCash;
          }
        });

      } catch (error) {
        console.error('AI trading error:', error);
      }
    };

    // Execute AI strategy every 2-4 seconds
    const interval = 2000 + Math.random() * 2000;
    console.log('🤖 Setting AI trade interval:', interval);
    aiTradeInterval = setInterval(rbcInvestEaseStrategy, interval);

    return () => {
      console.log('🤖 Clearing AI trade interval');
      if (aiTradeInterval) {
        clearInterval(aiTradeInterval);
      }
    };
  }, [isAITurn, gameComplete, roundNumber, stocks]);

  // Save game session to MongoDB
  const saveGameSession = async (finalValue: number) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/users/game-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: `single_${Date.now()}`,
          gameType: 'single',
          finalScore: finalValue,
          isAITurn,
          roundNumber,
          duration: (totalTime - timeLeft) * 1000,
          completedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log('✅ Game session saved to MongoDB');
      }
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  };

  const handleEventTrigger = useCallback((impact: 'positive' | 'negative' | 'neutral') => {
    const multiplier = impact === 'positive' ? 1.05 : impact === 'negative' ? 0.95 : 1;
    setStocks(prevStocks => 
      prevStocks.map(stock => ({
        ...stock,
        price: stock.price * multiplier
      }))
    );
  }, []);

  // Track trading decisions for Groq analysis
  const trackUserDecision = (action: 'buy' | 'sell', stock: Stock, quantity: number = 1) => {
    const portfolioValueBefore = totalValue;
    const portfolioValueAfter = action === 'buy' 
      ? totalValue - stock.price * quantity
      : totalValue + stock.price * quantity;

    const decision: TradingDecision = {
      timestamp: new Date().toISOString(),
      action,
      symbol: stock.symbol,
      quantity,
      price: stock.price,
      portfolio_value_before: portfolioValueBefore,
      portfolio_value_after: portfolioValueAfter,
      reasoning: `User ${action} decision for ${stock.name}`
    };

    setUserDecisions(prev => [...prev, decision]);
  };

  // Track AI decisions (called when AI makes trades)
  const trackAIDecision = (action: 'buy' | 'sell', stock: Stock, quantity: number = 1) => {
    const aiPortfolioValue = Object.entries(aiPortfolio).reduce((total, [symbol, shares]) => {
      const stockData = stocks.find(s => s.symbol === symbol);
      return total + (stockData ? stockData.price * (shares as number) : 0);
    }, 0);
    
    const portfolioValueBefore = aiCash + aiPortfolioValue;
    const portfolioValueAfter = action === 'buy' 
      ? portfolioValueBefore - stock.price * quantity
      : portfolioValueBefore + stock.price * quantity;

    const decision: TradingDecision = {
      timestamp: new Date().toISOString(),
      action,
      symbol: stock.symbol,
      quantity,
      price: stock.price,
      portfolio_value_before: portfolioValueBefore,
      portfolio_value_after: portfolioValueAfter,
      reasoning: `AI ${action} decision for ${stock.name}`
    };

    setAiDecisions(prev => [...prev, decision]);
  };

  // Generate Groq analysis after round completion
  const generateGroqAnalysis = async () => {
    if (!userDecisions.length && !aiDecisions.length) {
      console.log('No trading decisions to analyze');
      return;
    }

    setAnalysisLoading(true);
    try {
      const groqService = new GroqTradingAnalysisService();
      
      const simulationData: SimulationData = {
        round_number: roundNumber,
        duration_minutes: totalTime / 60,
        starting_portfolio_value: gameConfig.initialCash,
        ending_portfolio_value: totalValue,
        market_conditions: {
          volatility: 0.15, // Mock volatility
          trend: 'sideways', // Mock trend
          major_events: ['Market opened', 'Trading session active']
        },
        user_decisions: userDecisions,
        ai_decisions: aiDecisions,
        final_user_return: (totalValue - gameConfig.initialCash) / gameConfig.initialCash,
        final_ai_return: (rbcValue - gameConfig.initialCash) / gameConfig.initialCash
      };

      const analysis = await groqService.analyzeTradingPerformance(simulationData);
      setGroqAnalysis(analysis);
      console.log('✅ Groq analysis completed:', analysis);
    } catch (error) {
      console.error('Failed to generate Groq analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const buyStock = (stock: Stock) => {
    if (cash >= stock.price) {
      const newCash = cash - stock.price;
      const newShares = (portfolio[stock.symbol] || 0) + 1;
      
      setCash(newCash);
      setPortfolio(prev => ({
        ...prev,
        [stock.symbol]: (prev[stock.symbol] || 0) + 1
      }));
      
      console.log(`💰 BUY TRANSACTION:`, {
        stock: stock.symbol,
        name: stock.name,
        price: stock.price,
        shares_purchased: 1,
        new_total_shares: newShares,
        cash_before: cash,
        cash_after: newCash,
        timestamp: new Date().toISOString()
      });
      
      trackUserDecision('buy', stock);
    } else {
      console.log(`❌ BUY FAILED - Insufficient funds:`, {
        stock: stock.symbol,
        price: stock.price,
        available_cash: cash,
        shortfall: stock.price - cash
      });
    }
  };

  const sellStock = (stock: Stock) => {
    if (portfolio[stock.symbol] > 0) {
      const newCash = cash + stock.price;
      const currentShares = portfolio[stock.symbol];
      const newShares = currentShares - 1;
      
      setCash(newCash);
      setPortfolio(prev => {
        const newPortfolio = {
          ...prev,
          [stock.symbol]: prev[stock.symbol] - 1
        };
        // Remove the stock from portfolio if shares reach 0
        if (newPortfolio[stock.symbol] === 0) {
          delete newPortfolio[stock.symbol];
        }
        return newPortfolio;
      });
      
      console.log(`💸 SELL TRANSACTION:`, {
        stock: stock.symbol,
        name: stock.name,
        price: stock.price,
        shares_sold: 1,
        shares_before: currentShares,
        shares_after: newShares,
        cash_before: cash,
        cash_after: newCash,
        profit_loss: stock.price,
        timestamp: new Date().toISOString()
      });
      
      trackUserDecision('sell', stock);
    } else {
      console.log(`❌ SELL FAILED - No shares to sell:`, {
        stock: stock.symbol,
        current_shares: portfolio[stock.symbol] || 0
      });
    }
  };

  return (
    <div className="relative">
      <CharacterPopup onEventTrigger={handleEventTrigger} />
      
      <PortfolioView
        portfolio={isAITurn ? aiPortfolio : portfolio}
        stocks={stocks}
        cash={isAITurn ? aiCash : cash}
        totalValue={totalValue}
        timeLeft={timeLeft}
        totalTime={totalTime}
        isAITurn={isAITurn}
        onTrade={() => setShowTradingModal(true)}
      />

      <TradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        stocks={stocks}
        portfolio={portfolio}
        cash={cash}
        chartData={chartData}
        selectedStock={selectedStock || stocks[0]}
        onSelectStock={setSelectedStock}
        onBuy={buyStock}
        onSell={sellStock}
      />

      {isAITurn && (
        <AITradingFeed
          trades={aiTrades}
          currentValue={rbcValue}
          startValue={startValue}
        />
      )}

      {/* Groq Analysis Report Button - Show after game completion */}
      {gameComplete && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => {
              if (!groqAnalysis) {
                generateGroqAnalysis();
              }
              setShowAnalysisReport(true);
            }}
            disabled={analysisLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                     text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 
                     transition-all duration-200 pixel-font border-2 neon-border-blue"
          >
            {analysisLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Analyzing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                🧠 View AI Analysis
              </div>
            )}
          </button>
        </div>
      )}

      {/* Groq Analysis Report Modal */}
      {showAnalysisReport && groqAnalysis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 neon-border-purple rounded-xl 
                        max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-purple-900/30 border-b border-purple-400/30 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-purple-300 pixel-font">
                  🧠 AI TRADING ANALYSIS - ROUND {roundNumber}
                </h2>
                <button
                  onClick={() => setShowAnalysisReport(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-4">
                  <h3 className="text-blue-300 font-bold pixel-font mb-2">YOUR SCORE</h3>
                  <div className="text-3xl font-bold text-white">
                    {groqAnalysis.overall_performance.user_score}/100
                  </div>
                </div>
                <div className="bg-green-900/30 border border-green-400/30 rounded-lg p-4">
                  <h3 className="text-green-300 font-bold pixel-font mb-2">AI SCORE</h3>
                  <div className="text-3xl font-bold text-white">
                    {groqAnalysis.overall_performance.ai_score}/100
                  </div>
                </div>
                <div className="bg-yellow-900/30 border border-yellow-400/30 rounded-lg p-4">
                  <h3 className="text-yellow-300 font-bold pixel-font mb-2">PERFORMANCE GAP</h3>
                  <div className={`text-3xl font-bold ${
                    groqAnalysis.overall_performance.performance_gap > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {groqAnalysis.overall_performance.performance_gap > 0 ? '+' : ''}
                    {groqAnalysis.overall_performance.performance_gap.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-indigo-900/30 border border-indigo-400/30 rounded-lg p-4">
                <h3 className="text-indigo-300 font-bold pixel-font mb-3">💡 KEY INSIGHTS</h3>
                <ul className="space-y-2">
                  {groqAnalysis.key_insights.map((insight, index) => (
                    <li key={index} className="text-gray-200 retro-body flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-900/30 border border-green-400/30 rounded-lg p-4">
                  <h3 className="text-green-300 font-bold pixel-font mb-3">🤖 WHAT AI DID BETTER</h3>
                  <ul className="space-y-2">
                    {groqAnalysis.ai_comparison.what_ai_did_better.map((item, index) => (
                      <li key={index} className="text-gray-200 retro-body text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-900/30 border border-blue-400/30 rounded-lg p-4">
                  <h3 className="text-blue-300 font-bold pixel-font mb-3">👤 WHAT YOU DID BETTER</h3>
                  <ul className="space-y-2">
                    {groqAnalysis.ai_comparison.what_user_did_better.map((item, index) => (
                      <li key={index} className="text-gray-200 retro-body text-sm flex items-start gap-2">
                        <span className="text-blue-400 mt-1">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Learning Recommendations */}
              <div className="bg-orange-900/30 border border-orange-400/30 rounded-lg p-4">
                <h3 className="text-orange-300 font-bold pixel-font mb-3">📚 LEARNING RECOMMENDATIONS</h3>
                <ul className="space-y-2">
                  {groqAnalysis.learning_recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-200 retro-body flex items-start gap-2">
                      <span className="text-orange-400 mt-1">📖</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Round Tips */}
              <div className="bg-purple-900/30 border border-purple-400/30 rounded-lg p-4">
                <h3 className="text-purple-300 font-bold pixel-font mb-3">🎯 NEXT ROUND TIPS</h3>
                <ul className="space-y-2">
                  {groqAnalysis.next_round_tips.map((tip, index) => (
                    <li key={index} className="text-gray-200 retro-body flex items-start gap-2">
                      <span className="text-purple-400 mt-1">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900/50 border-t border-gray-600 p-4 text-center">
              <p className="text-gray-400 text-sm retro-body">
                Analysis powered by Groq AI • Keep practicing to improve your trading skills!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { PortfolioView } from './PortfolioView';
import { TradingModal } from './TradingModal';
import { NewsTicker } from './NewsTicker';
import { CharacterPopup } from './CharacterPopup';
import { AITradingFeed } from './AITradingFeed';
import { GameConfig } from './GameSetup';
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
}

// Mock stock data
const MOCK_STOCKS: Stock[] = [
  { symbol: 'TECH', name: 'TechCorp', price: 150.00, change: 0 },
  { symbol: 'ENER', name: 'EnergyPlus', price: 89.50, change: 0 },
  { symbol: 'HEAL', name: 'HealthMax', price: 210.75, change: 0 },
  { symbol: 'FINA', name: 'FinanceOne', price: 95.25, change: 0 },
  { symbol: 'AUTO', name: 'AutoDrive', price: 120.30, change: 0 },
  { symbol: 'RETA', name: 'RetailPro', price: 75.80, change: 0 }
];

export function SimpleTradingGame({ gameConfig, isAITurn, onComplete, roundNumber }: SimpleTradingGameProps) {
  const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
  const [selectedStock, setSelectedStock] = useState<Stock>(MOCK_STOCKS[0]);
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
    console.log('🔄 Round reset for round:', roundNumber, 'isAITurn:', isAITurn);
  }, [roundNumber, isAITurn, gameConfig.initialCash]);

  // Initialize RBC InvestEase client and portfolio
  useEffect(() => {
    const initializeRBC = async () => {
      try {
        // Initialize API from storage
        gameApi.initializeFromStorage();
        
        if (!gameApi.isAuthenticated()) {
          // Register team if not authenticated
          await gameApi.registerTeam({
            team_name: gameConfig.teamName,
            contact_email: gameConfig.contactEmail
          });
        }

        // Create or get client
        const clients = await gameApi.getClients();
        let client = clients.find(c => c.email === gameConfig.contactEmail);
        
        if (!client) {
          client = await gameApi.createClient({
            name: gameConfig.teamName,
            email: gameConfig.contactEmail,
            cash: gameConfig.initialCash
          });
        }

        setRbcClient(client);

        // Create or get portfolio
        const portfolios = await gameApi.getPortfolios(client.id);
        let portfolio = portfolios.find(p => p.type === 'balanced');
        
        if (!portfolio) {
          portfolio = await gameApi.createPortfolio(client.id, {
            type: 'balanced',
            initialAmount: gameConfig.initialCash
          });
        }

        setRbcPortfolio(portfolio);
        setRbcValue(portfolio.current_value);

      } catch (error) {
        console.error('Failed to initialize RBC InvestEase:', error);
        // Fallback to mock values
        setRbcValue(gameConfig.initialCash);
      }
    };

    initializeRBC();
  }, [gameConfig]);

  // Initialize chart data
  useEffect(() => {
    const initialData: StockData[] = [];
    for (let i = 0; i < 20; i++) {
      initialData.push({
        time: `${i}s`,
        price: selectedStock.price + (Math.random() - 0.5) * 10
      });
    }
    setChartData(initialData);
  }, [selectedStock.symbol]);

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
    const portfolioValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * shares : 0);
    }, 0);
    setTotalValue(cash + portfolioValue);
  }, [cash, portfolio, stocks]);

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
          
          // Use RBC value for AI rounds, player value for player rounds
          const finalValue = isAITurn ? rbcValue : totalValue;
          onComplete(finalValue);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [gameComplete]); // Removed all dependencies that could cause re-renders

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
    if (!isAITurn || gameComplete) return;
    
    console.log('🤖 AI trading started for round:', roundNumber);
    
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
                return total + (stock ? stock.price * shares : 0);
              }, 0);
              
              const newTotalValue = newCash + portfolioValue;
              setRbcValue(newTotalValue);
              
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
    const aiTradeInterval = setInterval(rbcInvestEaseStrategy, interval);

    return () => {
      console.log('🤖 Clearing AI trade interval');
      clearInterval(aiTradeInterval);
    };
  }, [isAITurn, gameComplete, roundNumber, stocks]);

  const handleEventTrigger = useCallback((impact: 'positive' | 'negative' | 'neutral') => {
    const multiplier = impact === 'positive' ? 1.05 : impact === 'negative' ? 0.95 : 1;
    setStocks(prevStocks => 
      prevStocks.map(stock => ({
        ...stock,
        price: stock.price * multiplier
      }))
    );
  }, []);

  const buyStock = (stock: Stock) => {
    if (cash >= stock.price) {
      setCash(cash - stock.price);
      setPortfolio(prev => ({
        ...prev,
        [stock.symbol]: (prev[stock.symbol] || 0) + 1
      }));
    }
  };

  const sellStock = (stock: Stock) => {
    if (portfolio[stock.symbol] > 0) {
      setCash(cash + stock.price);
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
    }
  };

  return (
    <div className="relative">
      <NewsTicker />
      <CharacterPopup onEventTrigger={handleEventTrigger} />
      
      <PortfolioView
        portfolio={isAITurn ? aiPortfolio : portfolio}
        stocks={stocks}
        cash={isAITurn ? aiCash : cash}
        totalValue={isAITurn ? rbcValue : totalValue}
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
        selectedStock={selectedStock}
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
    </div>
  );
}


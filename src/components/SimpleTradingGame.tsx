import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { PortfolioView } from './PortfolioView';
import { TradingModal } from './TradingModal';
import { NewsTicker } from './NewsTicker';
import { CharacterPopup } from './CharacterPopup';
import { AITradingFeed } from './AITradingFeed';
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

  // Timer countdown
  useEffect(() => {
    if (gameComplete) return;
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameComplete) {
      setGameComplete(true);
      setShowTradingModal(false);
      onComplete(totalValue);
    }
  }, [timeLeft, totalValue, onComplete, gameComplete]);

  // AI trading logic
  useEffect(() => {
    if (!isAITurn || timeLeft <= 0 || gameComplete) return;
    
    const aiTradeInterval = setInterval(() => {
      setStocks(currentStocks => {
        setCash(currentCash => {
          // AI makes "smart" trades based on trends
          const bestStock = currentStocks.reduce((best, current) => 
            current.change > best.change ? current : best
          );
          
          const shouldTrade = Math.random() > 0.4;
          const shouldBuy = Math.random() > 0.3;
          
          if (shouldTrade) {
            if (shouldBuy && currentCash >= bestStock.price) {
              const sharesToBuy = Math.floor(Math.random() * 3) + 1;
              const cost = bestStock.price * sharesToBuy;
              
              if (currentCash >= cost) {
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
                setPortfolio(prev => ({
                  ...prev,
                  [bestStock.symbol]: (prev[bestStock.symbol] || 0) + sharesToBuy
                }));
                return currentCash - cost;
              }
            } else {
              // Try to sell
              setPortfolio(currentPortfolio => {
                const ownedStocks = Object.entries(currentPortfolio).filter(([_, shares]) => shares > 0);
                if (ownedStocks.length > 0) {
                  const [stockSymbol, ownedShares] = ownedStocks[Math.floor(Math.random() * ownedStocks.length)];
                  const stock = currentStocks.find(s => s.symbol === stockSymbol);
                  
                  if (stock && ownedShares > 0) {
                    const sharesToSell = Math.floor(Math.random() * Math.min(ownedShares, 3)) + 1;
                    
                    // Record AI trade
                    const newTrade: AITrade = {
                      id: `${Date.now()}-${Math.random()}`,
                      action: 'SELL',
                      stock: stock.symbol,
                      shares: sharesToSell,
                      price: stock.price,
                      timestamp: Date.now()
                    };
                    
                    setAiTrades(prev => [...prev, newTrade]);
                    setCash(prev => prev + (stock.price * sharesToSell));
                    return {
                      ...currentPortfolio,
                      [stockSymbol]: currentPortfolio[stockSymbol] - sharesToSell
                    };
                  }
                }
                return currentPortfolio;
              });
            }
          }
          return currentCash;
        });
        return currentStocks;
      });
    }, 2500);

    return () => clearInterval(aiTradeInterval);
  }, [isAITurn, timeLeft, gameComplete]);

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
        portfolio={portfolio}
        stocks={stocks}
        cash={cash}
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
        selectedStock={selectedStock}
        onSelectStock={setSelectedStock}
        onBuy={buyStock}
        onSell={sellStock}
      />

      {isAITurn && (
        <AITradingFeed
          trades={aiTrades}
          currentValue={totalValue}
          startValue={startValue}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameConfig } from './GameSetup';
import { useAuthContext } from '../contexts/AuthContext';
import { StockHistoryModal } from './StockHistoryModal';

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

interface BattleResults {
  human: {
    finalValue: number;
    totalReturn: number;
  };
  autonomousAI: {
    finalValue: number;
    totalReturn: number;
  };
  investEase: {
    finalValue: number;
    totalReturn: number;
    strategy: string;
  };
  winner: 'human' | 'autonomousAI' | 'investease';
}

interface ThreeWayBattleSystemProps {
  gameConfig: GameConfig;
  onBattleComplete: (results: BattleResults) => void;
}

export function ThreeWayBattleSystem({ gameConfig, onBattleComplete }: ThreeWayBattleSystemProps) {
  // Game state
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [humanPortfolio, setHumanPortfolio] = useState<{[key: string]: number}>({});
  const [autonomousPortfolio, setAutonomousPortfolio] = useState<{[key: string]: number}>({});
  const [investEasePortfolio, setInvestEasePortfolio] = useState<{[key: string]: number}>({});
  const [humanCash, setHumanCash] = useState(gameConfig.initialCash);
  const [autonomousCash, setAutonomousCash] = useState(gameConfig.initialCash);
  const [investEaseCash, setInvestEaseCash] = useState(gameConfig.initialCash);
  const [investEaseValue, setInvestEaseValue] = useState(gameConfig.initialCash);
  const [investEaseStrategy, setInvestEaseStrategy] = useState('');
  const [timeLeft, setTimeLeft] = useState(gameConfig.timeframe * 5); // 5 seconds per day
  const [currentDay, setCurrentDay] = useState(1);
  const [gameComplete, setGameComplete] = useState(false);
  const [stockHistory, setStockHistory] = useState<{[key: string]: StockHistoryPoint[]}>({});
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [battlePhase, setBattlePhase] = useState<'setup' | 'human' | 'autonomous' | 'investease' | 'results' | 'complete'>('setup');
  const [, setBattleResults] = useState<BattleResults | null>(null);
  const { updateGameStats } = useAuthContext();

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
    if (gameComplete || !['human', 'autonomous', 'investease'].includes(battlePhase)) return;

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
          const newDay = Math.min(prevDay + 1, gameConfig.timeframe);
          console.log(`📅 Day ${newDay}/${gameConfig.timeframe}`);
          return newDay;
        });
        
        return updatedStocks;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [gameComplete, battlePhase, currentDay, gameConfig.timeframe]);

  // Timer countdown
  useEffect(() => {
    if (gameComplete || !['human', 'autonomous', 'investease'].includes(battlePhase)) return;

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
  }, [gameComplete, battlePhase]);

  // Complete turn when time runs out
  useEffect(() => {
    if (gameComplete && ['human', 'autonomous', 'investease'].includes(battlePhase)) {
      console.log(`🏁 ${battlePhase} turn complete! Moving to next...`);
      handleTurnComplete();
    }
  }, [gameComplete, battlePhase]);

  const handleTurnComplete = useCallback(() => {
    if (battlePhase === 'human') {
      console.log('👤 Human turn complete, starting Autonomous AI...');
      setBattlePhase('autonomous');
      resetForNewTurn();
    } else if (battlePhase === 'autonomous') {
      console.log('🤖 Autonomous AI turn complete, starting InvestEase...');
      setBattlePhase('investease');
      resetForNewTurn();
    } else if (battlePhase === 'investease') {
      console.log('🏦 InvestEase turn complete, calculating results...');
      calculateResults();
    }
  }, [battlePhase]);

  const resetForNewTurn = () => {
    setTimeLeft(gameConfig.timeframe * 5);
    setCurrentDay(1);
    setGameComplete(false);
  };

  // Autonomous AI trading logic
  useEffect(() => {
    if (battlePhase !== 'autonomous' || gameComplete) return;

    const interval = setInterval(() => {
      // Autonomous AI makes trading decisions
      stocks.forEach(stock => {
        const currentShares = autonomousPortfolio[stock.symbol] || 0;
        const canBuy = autonomousCash >= stock.price;
        const canSell = currentShares > 0;
        
        // Simple AI logic: buy when price is low (red), sell when price is high (green)
        if (stock.changePercent < -2 && canBuy) {
          // Buy when price drops significantly
          const sharesToBuy = Math.floor(autonomousCash / stock.price);
          if (sharesToBuy > 0) {
            setAutonomousCash(prev => prev - (stock.price * sharesToBuy));
            setAutonomousPortfolio(prev => ({
              ...prev,
              [stock.symbol]: (prev[stock.symbol] || 0) + sharesToBuy
            }));
            console.log(`🤖 AI bought ${sharesToBuy} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
          }
        } else if (stock.changePercent > 3 && canSell) {
          // Sell when price rises significantly
          const sharesToSell = Math.floor(currentShares * 0.5); // Sell half
          if (sharesToSell > 0) {
            setAutonomousCash(prev => prev + (stock.price * sharesToSell));
            setAutonomousPortfolio(prev => ({
              ...prev,
              [stock.symbol]: prev[stock.symbol] - sharesToSell
            }));
            console.log(`🤖 AI sold ${sharesToSell} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
          }
        }
      });
    }, 3000); // AI trades every 3 seconds

    return () => clearInterval(interval);
  }, [battlePhase, gameComplete, stocks, autonomousCash, autonomousPortfolio]);

  // InvestEase simulation (using RBC API) - ONLY during InvestEase turn
  useEffect(() => {
    if (battlePhase !== 'investease') return;

    // Run InvestEase simulation once at the start of the turn
    const runInvestEaseSimulation = async () => {
      try {
        const token = localStorage.getItem('game_token');
        if (token) {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/rbc/client/simulate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              months: Math.ceil(gameConfig.timeframe / 30),
              token: token
            })
          });

          if (response.ok) {
            const simulationData = await response.json();
            if (simulationData.results && simulationData.results.length > 0) {
              const result = simulationData.results[0];
              const finalValue = result.projectedValue || result.endingValue || gameConfig.initialCash;
              setInvestEaseValue(finalValue);
              setInvestEaseStrategy(result.strategy || 'RBC InvestEase AI Portfolio Management');
              // Update portfolio to reflect the final value
              setInvestEasePortfolio({});
              setInvestEaseCash(finalValue);
              console.log('🏦 InvestEase RBC simulation complete:', result);
            }
          }
        } else {
          // Fallback: simple growth simulation
          const growthRate = 0.02 + Math.random() * 0.03; // 2-5% growth
          const newValue = gameConfig.initialCash * (1 + growthRate);
          setInvestEaseValue(newValue);
          setInvestEaseStrategy('Fallback Growth Simulation');
          setInvestEasePortfolio({});
          setInvestEaseCash(newValue);
          console.log('🏦 InvestEase fallback simulation complete');
        }
      } catch (error) {
        console.warn('RBC API failed, using fallback simulation:', error);
        // Fallback: simple growth simulation
        const growthRate = 0.02 + Math.random() * 0.03; // 2-5% growth
        const newValue = gameConfig.initialCash * (1 + growthRate);
        setInvestEaseValue(newValue);
        setInvestEaseStrategy('Fallback Growth Simulation');
        setInvestEasePortfolio({});
        setInvestEaseCash(newValue);
        console.log('🏦 InvestEase fallback simulation complete');
      }
    };

    runInvestEaseSimulation();
    
    // InvestEase turn completes immediately after simulation
    setTimeout(() => {
      console.log('🏦 InvestEase turn complete, calculating results...');
      // Calculate results directly here instead of calling the function
      const humanValue = calculateTotalValue(humanPortfolio, humanCash);
      const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
      const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

      let winner: 'human' | 'autonomousAI' | 'investease' = 'human';
      if (autonomousValue > humanValue && autonomousValue > investEaseValue) {
        winner = 'autonomousAI';
      } else if (investEaseValue > humanValue && investEaseValue > autonomousValue) {
        winner = 'investease';
      }

      const results: BattleResults = {
        human: {
          finalValue: humanValue,
          totalReturn: ((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100
        },
        autonomousAI: {
          finalValue: autonomousValue,
          totalReturn: ((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100
        },
        investEase: {
          finalValue: investEaseValue,
          totalReturn: ((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100,
          strategy: investEaseStrategy
        },
        winner
      };

      setBattleResults(results);
      setBattlePhase('results');
      
      // Update game stats
      updateGameStats({
        score: humanValue,
        won: winner === 'human',
        gameType: 'three-way-battle',
        rounds: 1,
        aiScore: autonomousValue,
        investEaseScore: investEaseValue,
        humanReturn: results.human.totalReturn,
        aiReturn: results.autonomousAI.totalReturn,
        investEaseReturn: results.investEase.totalReturn,
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        onBattleComplete(results);
      }, 3000);
    }, 2000); // Give 2 seconds for simulation to complete
  }, [battlePhase, gameConfig.timeframe, gameConfig.initialCash]);

  const calculateResults = useCallback(() => {
    const humanValue = calculateTotalValue(humanPortfolio, humanCash);
    const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
    const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

    let winner: 'human' | 'autonomousAI' | 'investease' = 'human';
    if (autonomousValue > humanValue && autonomousValue > investEaseValue) {
      winner = 'autonomousAI';
    } else if (investEaseValue > humanValue && investEaseValue > autonomousValue) {
      winner = 'investease';
    }

    const results: BattleResults = {
      human: {
        finalValue: humanValue,
        totalReturn: ((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100
      },
      autonomousAI: {
        finalValue: autonomousValue,
        totalReturn: ((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100
      },
      investEase: {
        finalValue: investEaseValue,
        totalReturn: ((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100,
        strategy: investEaseStrategy
      },
      winner
    };

    setBattleResults(results);
    setBattlePhase('results');
    
    // Update game stats
    updateGameStats({
      score: humanValue,
      won: winner === 'human',
      gameType: 'three-way-battle',
      rounds: 1,
      aiScore: autonomousValue,
      investEaseScore: investEaseValue,
      humanReturn: results.human.totalReturn,
      aiReturn: results.autonomousAI.totalReturn,
      investEaseReturn: results.investEase.totalReturn,
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      onBattleComplete(results);
    }, 3000);
  }, [humanPortfolio, humanCash, autonomousPortfolio, autonomousCash, investEasePortfolio, investEaseCash, investEaseStrategy, gameConfig.initialCash, updateGameStats, onBattleComplete]);

  const calculateTotalValue = useCallback((portfolio: {[key: string]: number}, cash: number) => {
    const stockValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * shares : 0);
    }, 0);
    return cash + stockValue;
  }, [stocks]);

  const buyStock = useCallback((stock: Stock, shares: number = 1) => {
    const cost = stock.price * shares;
    if (humanCash >= cost) {
      setHumanCash(prev => prev - cost);
      setHumanPortfolio(prev => ({
        ...prev,
        [stock.symbol]: (prev[stock.symbol] || 0) + shares
      }));
      console.log(`💰 Human bought ${shares} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
    }
  }, [humanCash]);

  const sellStock = useCallback((stock: Stock, shares: number = 1) => {
    if (humanPortfolio[stock.symbol] >= shares) {
      const revenue = stock.price * shares;
      setHumanCash(prev => prev + revenue);
      setHumanPortfolio(prev => ({
        ...prev,
        [stock.symbol]: prev[stock.symbol] - shares
      }));
      console.log(`💸 Human sold ${shares} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
    }
  }, [humanPortfolio]);

  const startBattle = () => {
    console.log('🚀 Starting three-way battle...');
    setBattlePhase('human');
  };

  if (battlePhase === 'setup') {
    return (
      <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
        <div className="text-center">
          <h1 className="text-4xl neon-pink mb-8">🎯 THREE-WAY BATTLE</h1>
          <div className="text-2xl neon-cyan mb-8">
            Human vs Autonomous AI vs InvestEase
          </div>
          <div className="text-lg text-white mb-8">
            All three competitors will trade simultaneously for {gameConfig.timeframe} days
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startBattle}
            className="text-black text-2xl px-8 py-4 border-4 neon-border-yellow rounded-lg"
            style={{backgroundColor: '#fff900'}}
          >
            🚀 START BATTLE
          </motion.button>
        </div>
      </div>
    );
  }

  if (battlePhase === 'results') {
    const humanValue = calculateTotalValue(humanPortfolio, humanCash);
    const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
    const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

    return (
      <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
        <div className="text-center">
          <h1 className="text-4xl neon-pink mb-8">🏆 BATTLE RESULTS</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="border-4 neon-border-blue p-6" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
              <h3 className="text-2xl neon-blue mb-4">👤 HUMAN</h3>
              <div className="text-3xl neon-yellow mb-2">${humanValue.toFixed(2)}</div>
              <div className={`text-xl ${((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'neon-green' : 'neon-red'}`}>
                {((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
            <div className="border-4 neon-border-purple p-6" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
              <h3 className="text-2xl neon-purple mb-4">🤖 AUTONOMOUS AI</h3>
              <div className="text-3xl neon-yellow mb-2">${autonomousValue.toFixed(2)}</div>
              <div className={`text-xl ${((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'neon-green' : 'neon-red'}`}>
                {((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
            <div className="border-4 neon-border-green p-6" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
              <h3 className="text-2xl neon-green mb-4">🏦 INVESTEASE</h3>
              <div className="text-3xl neon-yellow mb-2">${investEaseValue.toFixed(2)}</div>
              <div className={`text-xl ${((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'neon-green' : 'neon-red'}`}>
                {((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const humanValue = calculateTotalValue(humanPortfolio, humanCash);
  const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);

  // Human Turn Page
  if (battlePhase === 'human') {
    return (
      <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl neon-pink mb-4"
          >
            👤 YOUR TURN
          </motion.div>
          
          <div className="text-lg text-white mb-4">
            DAY {currentDay} OF {gameConfig.timeframe} | {timeLeft}S REMAINING
          </div>
        </div>

        {/* Human Profile Card */}
        <div className="border-4 neon-border-yellow p-6 rounded-lg mb-8" style={{backgroundColor: 'rgba(255, 249, 0, 0.1)'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl neon-yellow mb-2">👤 HUMAN TRADER</h3>
              <div className="text-sm text-gray-400">Manual Trading Strategy</div>
            </div>
            <div className="text-right">
              <div className="text-3xl neon-yellow font-bold">${humanValue.toFixed(2)}</div>
              <div className={`text-lg ${((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
          </div>
          
          {/* Portfolio Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="neon-blue font-bold">CASH</div>
              <div className="text-white">${humanCash.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="neon-pink font-bold">INVESTMENTS</div>
              <div className="text-white">${(humanValue - humanCash).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="neon-green font-bold">TOTAL RETURN</div>
              <div className={`${((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
          </div>
        </div>

        {/* Stock Market */}
        <div className="mb-8">
          <h3 className="text-xl neon-cyan mb-4">📈 AVAILABLE STOCKS</h3>
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
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      buyStock(stock, 1);
                    }}
                    disabled={humanCash < stock.price}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Buy 1
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sellStock(stock, 1);
                    }}
                    disabled={(humanPortfolio[stock.symbol] || 0) < 1}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Sell 1
                  </button>
                </div>
                
                {humanPortfolio[stock.symbol] > 0 && (
                  <div className="text-xs text-white mt-2">
                    Own: {humanPortfolio[stock.symbol]} shares
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trading Logs and Summary */}
        <div className="border-4 neon-border-blue p-6 rounded-lg" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
          <h3 className="text-xl neon-blue mb-4">📊 TRADING LOGS & SUMMARY</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg neon-cyan mb-2">Current Holdings</h4>
              <div className="space-y-2">
                {Object.entries(humanPortfolio).filter(([_, shares]) => shares > 0).length > 0 ? (
                  Object.entries(humanPortfolio)
                    .filter(([_, shares]) => shares > 0)
                    .map(([symbol, shares]) => {
                      const stock = stocks.find(s => s.symbol === symbol);
                      return (
                        <div key={symbol} className="flex justify-between text-sm">
                          <span className="text-white">{symbol}: {shares} shares</span>
                          <span className="text-cyan-400">${stock ? (stock.price * shares).toFixed(2) : '0.00'}</span>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-gray-400 text-sm">No current holdings</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-lg neon-cyan mb-2">Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white">Starting Value:</span>
                  <span className="text-white">${gameConfig.initialCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Current Value:</span>
                  <span className="text-cyan-400">${humanValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Gain/Loss:</span>
                  <span className={`${((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
                  </span>
                </div>
              </div>
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

  // Autonomous AI Turn Page
  if (battlePhase === 'autonomous') {
    return (
      <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl neon-purple mb-4"
          >
            🤖 AUTONOMOUS AI TURN
          </motion.div>
          
          <div className="text-lg text-white mb-4">
            DAY {currentDay} OF {gameConfig.timeframe} | {timeLeft}S REMAINING
          </div>
        </div>

        {/* AI Profile Card */}
        <div className="border-4 neon-border-purple p-6 rounded-lg mb-8" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl neon-purple mb-2">🤖 AUTONOMOUS AI</h3>
              <div className="text-sm text-gray-400">Algorithmic Trading Strategy</div>
            </div>
            <div className="text-right">
              <div className="text-3xl neon-purple font-bold">${autonomousValue.toFixed(2)}</div>
              <div className={`text-lg ${((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
          </div>
          
          {/* Portfolio Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="neon-blue font-bold">CASH</div>
              <div className="text-white">${autonomousCash.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="neon-pink font-bold">INVESTMENTS</div>
              <div className="text-white">${(autonomousValue - autonomousCash).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="neon-green font-bold">TOTAL RETURN</div>
              <div className={`${((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
          </div>
        </div>

        {/* AI Status */}
        <div className="mb-8 text-center">
          <div className="text-2xl neon-purple mb-4">🤖 AI IS TRADING...</div>
          <div className="text-lg text-white">The AI is analyzing market conditions and making trades automatically</div>
        </div>

        {/* Available Stocks (No Buy/Sell Buttons) */}
        <div className="mb-8">
          <h3 className="text-xl neon-cyan mb-4">📈 MARKET OVERVIEW</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <motion.div
                key={stock.symbol}
                whileHover={{ scale: 1.02 }}
                className="border-2 neon-border-cyan p-4 rounded-lg"
                style={{backgroundColor: 'rgba(0, 255, 255, 0.1)'}}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="neon-cyan font-bold">{stock.symbol}</div>
                    <div className="text-sm text-white">{stock.name}</div>
                    <div className="text-xs text-gray-400">{stock.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">${stock.price.toFixed(2)}</div>
                    <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                {autonomousPortfolio[stock.symbol] > 0 && (
                  <div className="text-xs text-white mt-2">
                    AI Owns: {autonomousPortfolio[stock.symbol]} shares
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Trading Logs and Summary */}
        <div className="border-4 neon-border-blue p-6 rounded-lg" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
          <h3 className="text-xl neon-blue mb-4">📊 AI TRADING LOGS & SUMMARY</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg neon-cyan mb-2">AI Holdings</h4>
              <div className="space-y-2">
                {Object.entries(autonomousPortfolio).filter(([_, shares]) => shares > 0).length > 0 ? (
                  Object.entries(autonomousPortfolio)
                    .filter(([_, shares]) => shares > 0)
                    .map(([symbol, shares]) => {
                      const stock = stocks.find(s => s.symbol === symbol);
                      return (
                        <div key={symbol} className="flex justify-between text-sm">
                          <span className="text-white">{symbol}: {shares} shares</span>
                          <span className="text-cyan-400">${stock ? (stock.price * shares).toFixed(2) : '0.00'}</span>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-gray-400 text-sm">No current holdings</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-lg neon-cyan mb-2">AI Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white">Starting Value:</span>
                  <span className="text-white">${gameConfig.initialCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Current Value:</span>
                  <span className="text-cyan-400">${autonomousValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Gain/Loss:</span>
                  <span className={`${((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{(((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // InvestEase Turn Page
  if (battlePhase === 'investease') {
    return (
      <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl neon-green mb-4"
          >
            🏦 INVESTEASE TURN
          </motion.div>
          
          <div className="text-lg text-white mb-4">
            Running RBC InvestEase simulation...
          </div>
        </div>

        {/* InvestEase Profile Card */}
        <div className="border-4 neon-border-green p-6 rounded-lg mb-8" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl neon-green mb-2">🏦 INVESTEASE</h3>
              <div className="text-sm text-gray-400">RBC AI Portfolio Management</div>
            </div>
            <div className="text-right">
              <div className="text-3xl neon-green font-bold">${investEaseValue.toFixed(2)}</div>
              <div className={`text-lg ${((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
              </div>
            </div>
          </div>
          
          {/* Portfolio Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="neon-blue font-bold">CASH</div>
              <div className="text-white">${investEaseCash.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="neon-pink font-bold">INVESTMENTS</div>
              <div className="text-white">${(investEaseValue - investEaseCash).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="neon-green font-bold">TOTAL RETURN</div>
              <div className={`${((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{(((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* InvestEase Status */}
        <div className="mb-8 text-center">
          <div className="text-2xl neon-green mb-4">🏦 INVESTEASE IS SIMULATING...</div>
          <div className="text-lg text-white">Running RBC InvestEase portfolio simulation</div>
        </div>

        {/* Market Overview (No Buy/Sell Buttons) */}
        <div className="mb-8">
          <h3 className="text-xl neon-cyan mb-4">📈 MARKET OVERVIEW</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <motion.div
                key={stock.symbol}
                whileHover={{ scale: 1.02 }}
                className="border-2 neon-border-cyan p-4 rounded-lg"
                style={{backgroundColor: 'rgba(0, 255, 255, 0.1)'}}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="neon-cyan font-bold">{stock.symbol}</div>
                    <div className="text-sm text-white">{stock.name}</div>
                    <div className="text-xs text-gray-400">{stock.sector}</div>
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

        {/* InvestEase Simulation Logs and Summary */}
        <div className="border-4 neon-border-blue p-6 rounded-lg" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
          <h3 className="text-xl neon-blue mb-4">📊 INVESTEASE SIMULATION LOGS & SUMMARY</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg neon-cyan mb-2">Simulation Strategy</h4>
              <div className="space-y-2 text-sm">
                <div className="text-white">
                  <strong>Strategy:</strong> {investEaseStrategy || 'RBC AI Portfolio Management'}
                </div>
                <div className="text-white">
                  <strong>Method:</strong> RBC InvestEase API Simulation
                </div>
                <div className="text-white">
                  <strong>Duration:</strong> {gameConfig.timeframe} days
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg neon-cyan mb-2">Simulation Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white">Starting Value:</span>
                  <span className="text-white">${gameConfig.initialCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Final Value:</span>
                  <span className="text-cyan-400">${investEaseValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">Gain/Loss:</span>
                  <span className={`${((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

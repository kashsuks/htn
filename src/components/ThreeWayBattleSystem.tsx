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
  const [investEaseComplete, setInvestEaseComplete] = useState(false);
  const [rbcApiCalled, setRbcApiCalled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(gameConfig.timeframe * 5); // 5 seconds per day
  const [currentDay, setCurrentDay] = useState(1);
  const [gameComplete, setGameComplete] = useState(false);
  const [stockHistory, setStockHistory] = useState<{[key: string]: StockHistoryPoint[]}>({});
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [battlePhase, setBattlePhase] = useState<'setup' | 'human' | 'autonomous' | 'investease' | 'results' | 'complete'>('setup');
  const [, setBattleResults] = useState<BattleResults | null>(null);
  const [selectedTrader, setSelectedTrader] = useState<'human' | 'autonomous' | 'investease' | null>(null);
  const [humanTrends, setHumanTrends] = useState<{day: number, value: number}[]>([]);
  const [autonomousTrends, setAutonomousTrends] = useState<{day: number, value: number}[]>([]);
  const [investEaseTrends, setInvestEaseTrends] = useState<{day: number, value: number}[]>([]);
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

  // Update stock prices every 5 seconds (daily) - ONLY for Human and Autonomous AI
  useEffect(() => {
    if (gameComplete || !['human', 'autonomous'].includes(battlePhase)) return;

    const interval = setInterval(() => {
      // Stop updating if time is up
      if (timeLeft <= 0) {
        return;
      }
      
      setStocks(prevStocks => {
        const updatedStocks = prevStocks.map(stock => {
          // Generate realistic price movement (-5% to +5%)
          const changePercent = (Math.random() - 0.5) * 10;
          const newPrice = Math.max(1, stock.price * (1 + changePercent / 100));
          const change = newPrice - stock.price;
          
          console.log(`📊 ${stock.symbol}: $${stock.price.toFixed(2)} → $${newPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`);
          
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
        
        // Update trends for all traders
        updateTrends();
        
        return updatedStocks;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [gameComplete, battlePhase, currentDay, gameConfig.timeframe, timeLeft]);

  // Timer countdown - ONLY for Human and Autonomous AI (NO AUTO-COMPLETION)
  useEffect(() => {
    if (gameComplete || !['human', 'autonomous'].includes(battlePhase)) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Don't auto-complete, just stop at 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameComplete, battlePhase]);

  // NO AUTOMATIC TURN COMPLETION - Manual buttons only

  // Manual turn completion removed - users click buttons to proceed

  const handleNextPhase = () => {
    if (battlePhase === 'human') {
      setBattlePhase('autonomous');
      resetForNewTurn();
    } else if (battlePhase === 'autonomous') {
      setBattlePhase('investease');
      resetForNewTurn();
    } else if (battlePhase === 'investease') {
      setBattlePhase('results');
    }
  };

  const handleViewResults = () => {
    // Calculate results on demand
    const humanValue = calculateTotalValue(humanPortfolio, humanCash);
    const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
    const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

    const humanReturn = ((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const autonomousReturn = ((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const investEaseReturn = ((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;

    let winner: 'human' | 'autonomousAI' | 'investease' = 'human';
    let winnerReturn = humanReturn;
    if (autonomousReturn > winnerReturn) {
      winner = 'autonomousAI';
      winnerReturn = autonomousReturn;
    }
    if (investEaseReturn > winnerReturn) {
      winner = 'investease';
      winnerReturn = investEaseReturn;
    }

    const results: BattleResults = {
      human: {
        finalValue: humanValue,
        totalReturn: humanReturn
      },
      autonomousAI: {
        finalValue: autonomousValue,
        totalReturn: autonomousReturn
      },
      investEase: {
        finalValue: investEaseValue,
        totalReturn: investEaseReturn,
        strategy: investEaseStrategy
      },
      winner
    };

    onBattleComplete(results);
  };

  const resetForNewTurn = () => {
    setTimeLeft(gameConfig.timeframe * 5);
    setCurrentDay(1);
    setGameComplete(false);
    setInvestEaseComplete(false);
  };

  // Autonomous AI trading logic
  useEffect(() => {
    if (battlePhase !== 'autonomous' || gameComplete) return;

    const interval = setInterval(() => {
      // Stop trading if time is up
      if (timeLeft <= 0) {
        return;
      }
      
      // Autonomous AI makes trading decisions
      stocks.forEach(stock => {
        const currentShares = autonomousPortfolio[stock.symbol] || 0;
        const canBuy = autonomousCash >= stock.price;
        const canSell = currentShares > 0;
        
        // Simple AI logic: buy when price is low (red), sell when price is high (green)
        if (stock.changePercent < -2 && canBuy) {
          // Buy when price drops significantly - but only buy 1 share to be very conservative
          const sharesToBuy = 1;
          const totalCost = stock.price * sharesToBuy;
          
          // Triple check we have enough cash using current state
          if (sharesToBuy > 0 && autonomousCash >= totalCost) {
            setAutonomousCash(prev => {
              // Final safety check
              if (prev < totalCost) {
                console.log(`🤖 AI insufficient funds: $${prev.toFixed(2)} < $${totalCost.toFixed(2)}`);
                return prev;
              }
              const newCash = prev - totalCost;
              console.log(`🤖 AI buying ${sharesToBuy} ${stock.symbol} @ $${stock.price.toFixed(2)} (Cost: $${totalCost.toFixed(2)}, Cash: $${prev.toFixed(2)} → $${newCash.toFixed(2)})`);
              return newCash;
            });
            setAutonomousPortfolio(prev => ({
              ...prev,
              [stock.symbol]: (prev[stock.symbol] || 0) + sharesToBuy
            }));
          } else {
            console.log(`🤖 AI cannot buy ${stock.symbol}: insufficient funds ($${autonomousCash.toFixed(2)} < $${totalCost.toFixed(2)})`);
          }
        } else if (stock.changePercent > 3 && canSell) {
          // Sell when price rises significantly
          const sharesToSell = Math.min(1, currentShares); // Sell only 1 share at a time
          if (sharesToSell > 0) {
            const revenue = stock.price * sharesToSell;
            setAutonomousCash(prev => {
              const newCash = prev + revenue;
              console.log(`🤖 AI sold ${sharesToSell} ${stock.symbol} @ $${stock.price.toFixed(2)} (Revenue: $${revenue.toFixed(2)}, Cash: $${prev.toFixed(2)} → $${newCash.toFixed(2)})`);
              return newCash;
            });
            setAutonomousPortfolio(prev => ({
              ...prev,
              [stock.symbol]: prev[stock.symbol] - sharesToSell
            }));
          }
        }
      });
    }, 3000); // AI trades every 3 seconds

    return () => clearInterval(interval);
  }, [battlePhase, gameComplete, stocks, autonomousCash, autonomousPortfolio, timeLeft]);

  // InvestEase simulation (using RBC API) - Independent simulation
  useEffect(() => {
    if (battlePhase !== 'investease' || rbcApiCalled) return;

    // Run InvestEase simulation once at the start of the turn
    const runInvestEaseSimulation = async () => {
      setRbcApiCalled(true);
      console.log('🏦 Starting InvestEase independent simulation...');
      
      // Show loading state
      setInvestEaseStrategy('Connecting to RBC API...');
      
       try {
         const token = localStorage.getItem('game_token');
         if (token) {
           setInvestEaseStrategy('Creating InvestEase client...');
           
           // First create a client for InvestEase simulation
           const createClientResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/rbc/clients`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({
               name: 'InvestEase Simulator',
               email: 'investease@rbc.com',
               cash: gameConfig.initialCash,
               token: token
             })
           });

           if (createClientResponse.ok) {
             const clientData = await createClientResponse.json();
             const clientId = clientData.client?.id || clientData.id;
             
             setInvestEaseStrategy('Sending simulation request...');
             
             // Now run the simulation with the created client
             const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/rbc/client/${clientId}/simulate`, {
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

             // Mark InvestEase as complete immediately after API request
             setInvestEaseComplete(true);

             if (response.ok) {
               setInvestEaseStrategy('Processing simulation results...');
               const simulationData = await response.json();
               if (simulationData.results && simulationData.results.length > 0) {
                 const result = simulationData.results[0];
                 const finalValue = result.projectedValue || result.endingValue || gameConfig.initialCash;
                 setInvestEaseValue(finalValue);
                 setInvestEaseStrategy(result.strategy || 'RBC InvestEase AI Portfolio Management');
                 setInvestEasePortfolio({});
                 setInvestEaseCash(finalValue);
                 setInvestEaseComplete(true);
                 
                 // Process growth_trend data for InvestEase trends
                 if (result.growth_trend && Array.isArray(result.growth_trend)) {
                   const investEaseTrendData = result.growth_trend.map((point: any, index: number) => ({
                     day: index,
                     value: point.value
                   }));
                   setInvestEaseTrends(investEaseTrendData);
                   console.log('🏦 InvestEase growth trend processed:', investEaseTrendData.length, 'data points');
                 }
                 
                 console.log('🏦 InvestEase RBC simulation complete:', result);
               }
             } else {
               console.warn('RBC simulation failed, using fallback');
               throw new Error('Simulation failed');
             }
           } else {
             console.warn('RBC client creation failed, using fallback');
             throw new Error('Client creation failed');
           }
         } else {
           // Fallback: InvestEase-style simulation with realistic market behavior
           const strategies = ['balanced', 'conservative', 'aggressive', 'growth-focused'];
           const strategy = strategies[Math.floor(Math.random() * strategies.length)];
           const growthRate = 0.015 + Math.random() * 0.025; // 1.5-4% growth (more conservative)
           const newValue = gameConfig.initialCash * (1 + growthRate);
           setInvestEaseValue(newValue);
           setInvestEaseStrategy(`Fallback ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Strategy`);
           setInvestEasePortfolio({});
           setInvestEaseCash(newValue);
           setInvestEaseComplete(true);
           
           // Generate realistic InvestEase-style trend data with market volatility
           const fallbackTrendData = [];
           let currentValue = gameConfig.initialCash;
           for (let day = 0; day <= gameConfig.timeframe; day++) {
             // Add some realistic market volatility
             const dailyVolatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility
             const trendGrowth = (newValue - gameConfig.initialCash) / gameConfig.timeframe;
             currentValue += trendGrowth + (currentValue * dailyVolatility);
             currentValue = Math.max(currentValue, gameConfig.initialCash * 0.8); // Prevent major losses
             
             fallbackTrendData.push({ day, value: currentValue });
           }
           setInvestEaseTrends(fallbackTrendData);
           console.log('🏦 InvestEase fallback simulation complete with', fallbackTrendData.length, 'data points using', strategy, 'strategy');
         }
      } catch (error) {
        console.warn('RBC API failed, using fallback simulation:', error);
        // Fallback: InvestEase-style simulation with realistic market behavior
        const strategies = ['balanced', 'conservative', 'aggressive', 'growth-focused'];
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        const growthRate = 0.015 + Math.random() * 0.025; // 1.5-4% growth (more conservative)
        const newValue = gameConfig.initialCash * (1 + growthRate);
        setInvestEaseValue(newValue);
        setInvestEaseStrategy(`Fallback ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Strategy`);
        setInvestEasePortfolio({});
        setInvestEaseCash(newValue);
        
        // Generate realistic InvestEase-style trend data with market volatility
        const fallbackTrendData = [];
        let currentValue = gameConfig.initialCash;
        for (let day = 0; day <= gameConfig.timeframe; day++) {
          // Add some realistic market volatility
          const dailyVolatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility
          const trendGrowth = (newValue - gameConfig.initialCash) / gameConfig.timeframe;
          currentValue += trendGrowth + (currentValue * dailyVolatility);
          currentValue = Math.max(currentValue, gameConfig.initialCash * 0.8); // Prevent major losses
          
          fallbackTrendData.push({ day, value: currentValue });
        }
        setInvestEaseTrends(fallbackTrendData);
        console.log('🏦 InvestEase fallback simulation complete with', fallbackTrendData.length, 'data points using', strategy, 'strategy');
      }
    };

    runInvestEaseSimulation();
    
    // NO AUTOMATIC COMPLETION - User must click button to proceed
  }, [battlePhase, gameConfig.timeframe, gameConfig.initialCash, rbcApiCalled]);

  const calculateResults = useCallback(() => {
    const humanValue = calculateTotalValue(humanPortfolio, humanCash);
    const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
    const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

    // Calculate returns for proper winner determination
    const humanReturn = ((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const autonomousReturn = ((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const investEaseReturn = ((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;

    let winner: 'human' | 'autonomousAI' | 'investease' = 'human';
    let winnerReturn = humanReturn;
    if (autonomousReturn > winnerReturn) {
      winner = 'autonomousAI';
      winnerReturn = autonomousReturn;
    }
    if (investEaseReturn > winnerReturn) {
      winner = 'investease';
      winnerReturn = investEaseReturn;
    }

    const results: BattleResults = {
      human: {
        finalValue: humanValue,
        totalReturn: humanReturn
      },
      autonomousAI: {
        finalValue: autonomousValue,
        totalReturn: autonomousReturn
      },
      investEase: {
        finalValue: investEaseValue,
        totalReturn: investEaseReturn,
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

    onBattleComplete(results);
  }, [humanPortfolio, humanCash, autonomousPortfolio, autonomousCash, investEasePortfolio, investEaseCash, investEaseStrategy, gameConfig.initialCash, updateGameStats, onBattleComplete]);

  const calculateTotalValue = useCallback((portfolio: {[key: string]: number}, cash: number) => {
    const stockValue = Object.entries(portfolio).reduce((total, [symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return total + (stock ? stock.price * shares : 0);
    }, 0);
    return cash + stockValue;
  }, [stocks]);

  // Track money trends for each trader
  const updateTrends = useCallback(() => {
    const currentDay = Math.ceil((gameConfig.timeframe * 5 - timeLeft) / 5);
    const humanValue = calculateTotalValue(humanPortfolio, humanCash);
    const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
    const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

    setHumanTrends(prev => [...prev, { day: currentDay, value: humanValue }]);
    setAutonomousTrends(prev => [...prev, { day: currentDay, value: autonomousValue }]);
    setInvestEaseTrends(prev => [...prev, { day: currentDay, value: investEaseValue }]);
  }, [timeLeft, humanPortfolio, humanCash, autonomousPortfolio, autonomousCash, investEasePortfolio, investEaseCash, gameConfig.timeframe, calculateTotalValue]);

  // Initialize trends with starting values
  useEffect(() => {
    if (battlePhase === 'human' && humanTrends.length === 0) {
      setHumanTrends([{ day: 0, value: gameConfig.initialCash }]);
      setAutonomousTrends([{ day: 0, value: gameConfig.initialCash }]);
      setInvestEaseTrends([{ day: 0, value: gameConfig.initialCash }]);
    }
  }, [battlePhase, humanTrends.length, gameConfig.initialCash]);

  // Add final trend data when results are shown
  useEffect(() => {
    if (battlePhase === 'results') {
      const humanValue = calculateTotalValue(humanPortfolio, humanCash);
      const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
      const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

      // Add final values to trends if not already added
      setHumanTrends(prev => {
        const lastDay = prev.length > 0 ? prev[prev.length - 1].day : 0;
        if (prev.length === 0 || prev[prev.length - 1].value !== humanValue) {
          return [...prev, { day: lastDay + 1, value: humanValue }];
        }
        return prev;
      });

      setAutonomousTrends(prev => {
        const lastDay = prev.length > 0 ? prev[prev.length - 1].day : 0;
        if (prev.length === 0 || prev[prev.length - 1].value !== autonomousValue) {
          return [...prev, { day: lastDay + 1, value: autonomousValue }];
        }
        return prev;
      });

      setInvestEaseTrends(prev => {
        const lastDay = prev.length > 0 ? prev[prev.length - 1].day : 0;
        if (prev.length === 0 || prev[prev.length - 1].value !== investEaseValue) {
          return [...prev, { day: lastDay + 1, value: investEaseValue }];
        }
        return prev;
      });
    }
  }, [battlePhase, humanPortfolio, humanCash, autonomousPortfolio, autonomousCash, investEasePortfolio, investEaseCash, calculateTotalValue]);

  const buyStock = useCallback((stock: Stock, shares: number = 1) => {
    // Don't allow trading if time is up
    if (timeLeft <= 0) {
      console.log('⏰ Trading disabled - time is up!');
      return;
    }
    
    const cost = stock.price * shares;
    if (humanCash >= cost) {
      setHumanCash(prev => prev - cost);
      setHumanPortfolio(prev => ({
        ...prev,
        [stock.symbol]: (prev[stock.symbol] || 0) + shares
      }));
      console.log(`💰 Human bought ${shares} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
    }
  }, [humanCash, timeLeft]);

  const sellStock = useCallback((stock: Stock, shares: number = 1) => {
    // Don't allow trading if time is up
    if (timeLeft <= 0) {
      console.log('⏰ Trading disabled - time is up!');
      return;
    }
    
    if (humanPortfolio[stock.symbol] >= shares) {
      const revenue = stock.price * shares;
      setHumanCash(prev => prev + revenue);
      setHumanPortfolio(prev => ({
        ...prev,
        [stock.symbol]: prev[stock.symbol] - shares
      }));
      console.log(`💸 Human sold ${shares} ${stock.symbol} @ $${stock.price.toFixed(2)}`);
    }
  }, [humanPortfolio, timeLeft]);

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

    // Calculate returns
    const humanReturn = ((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const autonomousReturn = ((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const investEaseReturn = ((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;

    // Determine winner by highest return percentage
    let winner = 'human';
    let winnerReturn = humanReturn;
    if (autonomousReturn > winnerReturn) {
      winner = 'autonomous';
      winnerReturn = autonomousReturn;
    }
    if (investEaseReturn > winnerReturn) {
      winner = 'investease';
      winnerReturn = investEaseReturn;
    }

    const getWinnerIcon = (trader: string) => {
      if (trader === winner) return '👑';
      return trader === 'human' ? '👤' : trader === 'autonomous' ? '🤖' : '🏦';
    };

    const getWinnerColor = (trader: string) => {
      if (trader === winner) return 'neon-yellow';
      return trader === 'human' ? 'neon-blue' : trader === 'autonomous' ? 'neon-purple' : 'neon-green';
    };

    return (
      <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
        <div className="text-center mb-8">
          <h1 className="text-4xl neon-pink mb-4">🏆 BATTLE RESULTS</h1>
          <div className="text-2xl neon-yellow mb-2">
            {winner === 'human' && '👤 HUMAN WINS!'}
            {winner === 'autonomous' && '🤖 AUTONOMOUS AI WINS!'}
            {winner === 'investease' && '🏦 INVESTEASE WINS!'}
          </div>
          <div className="text-lg text-white">
            Highest Return: {winnerReturn >= 0 ? '+' : ''}{winnerReturn.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Human Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border-4 ${winner === 'human' ? 'neon-border-yellow' : 'neon-border-blue'} p-6 rounded-lg cursor-pointer`}
            style={{backgroundColor: winner === 'human' ? 'rgba(255, 249, 0, 0.2)' : 'rgba(0, 225, 255, 0.1)'}}
            onClick={() => setSelectedTrader('human')}
          >
            <div className="text-center">
              <h3 className={`text-2xl ${getWinnerColor('human')} mb-4`}>
                {getWinnerIcon('human')} HUMAN
              </h3>
              <div className="text-3xl neon-yellow mb-2">${humanValue.toFixed(2)}</div>
              <div className={`text-xl ${humanReturn >= 0 ? 'neon-green' : 'neon-red'}`}>
                {humanReturn >= 0 ? '+' : ''}{humanReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-2">Click to view trend graph</div>
            </div>
          </motion.div>

          {/* Autonomous AI Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border-4 ${winner === 'autonomous' ? 'neon-border-yellow' : 'neon-border-purple'} p-6 rounded-lg cursor-pointer`}
            style={{backgroundColor: winner === 'autonomous' ? 'rgba(255, 249, 0, 0.2)' : 'rgba(97, 0, 255, 0.1)'}}
            onClick={() => setSelectedTrader('autonomous')}
          >
            <div className="text-center">
              <h3 className={`text-2xl ${getWinnerColor('autonomous')} mb-4`}>
                {getWinnerIcon('autonomous')} AUTONOMOUS AI
              </h3>
              <div className="text-3xl neon-yellow mb-2">${autonomousValue.toFixed(2)}</div>
              <div className={`text-xl ${autonomousReturn >= 0 ? 'neon-green' : 'neon-red'}`}>
                {autonomousReturn >= 0 ? '+' : ''}{autonomousReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-2">Click to view trend graph</div>
            </div>
          </motion.div>

          {/* InvestEase Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border-4 ${winner === 'investease' ? 'neon-border-yellow' : 'neon-border-green'} p-6 rounded-lg cursor-pointer`}
            style={{backgroundColor: winner === 'investease' ? 'rgba(255, 249, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)'}}
            onClick={() => setSelectedTrader('investease')}
          >
            <div className="text-center">
              <h3 className={`text-2xl ${getWinnerColor('investease')} mb-4`}>
                {getWinnerIcon('investease')} INVESTEASE
              </h3>
              <div className="text-3xl neon-yellow mb-2">${investEaseValue.toFixed(2)}</div>
              <div className={`text-xl ${investEaseReturn >= 0 ? 'neon-green' : 'neon-red'}`}>
                {investEaseReturn >= 0 ? '+' : ''}{investEaseReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-2">Click to view trend graph</div>
            </div>
          </motion.div>
        </div>

        {/* Trend Graph Modal */}
        {selectedTrader && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border-4 neon-border-blue p-8 rounded-lg shadow-lg w-full max-w-4xl relative text-white"
            >
              <button
                onClick={() => setSelectedTrader(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
              
              <h2 className="text-3xl neon-cyan mb-4 text-center">
                {selectedTrader === 'human' && '👤 HUMAN TRADER'}
                {selectedTrader === 'autonomous' && '🤖 AUTONOMOUS AI'}
                {selectedTrader === 'investease' && '🏦 INVESTEASE'}
                {' '}MONEY TREND
              </h2>
              
              {/* Debug info */}
              <div className="text-sm text-gray-400 mb-4 text-center">
                Data points: {(selectedTrader === 'human' ? humanTrends : 
                  selectedTrader === 'autonomous' ? autonomousTrends : 
                  investEaseTrends).length}
                {selectedTrader === 'investease' && (
                  <div className="mt-2">
                    <div>Strategy: {investEaseStrategy}</div>
                    <div>Simulation Method: {investEaseTrends.length > 0 ? 'RBC InvestEase API' : 'Fallback Growth'}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xl neon-blue mb-2">Performance Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">Starting Value:</span>
                      <span className="text-white">${gameConfig.initialCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Final Value:</span>
                      <span className="text-cyan-400">
                        ${selectedTrader === 'human' ? humanValue.toFixed(2) : 
                          selectedTrader === 'autonomous' ? autonomousValue.toFixed(2) : 
                          investEaseValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Total Return:</span>
                      <span className={`${selectedTrader === 'human' ? humanReturn : 
                        selectedTrader === 'autonomous' ? autonomousReturn : 
                        investEaseReturn} >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedTrader === 'human' ? (humanReturn >= 0 ? '+' : '') + humanReturn.toFixed(2) + '%' : 
                         selectedTrader === 'autonomous' ? (autonomousReturn >= 0 ? '+' : '') + autonomousReturn.toFixed(2) + '%' : 
                         (investEaseReturn >= 0 ? '+' : '') + investEaseReturn.toFixed(2) + '%'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl neon-blue mb-2">Trend Data</h3>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <table className="min-w-full bg-gray-800 rounded-lg">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b border-gray-700 text-left neon-blue">Day</th>
                          <th className="py-2 px-4 border-b border-gray-700 text-left neon-blue">Value</th>
                          <th className="py-2 px-4 border-b border-gray-700 text-left neon-blue">Change (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedTrader === 'human' ? humanTrends : 
                          selectedTrader === 'autonomous' ? autonomousTrends : 
                          investEaseTrends).length > 0 ? (
                          (selectedTrader === 'human' ? humanTrends : 
                            selectedTrader === 'autonomous' ? autonomousTrends : 
                            investEaseTrends).map((point, index) => {
                            const prevValue = index > 0 ? 
                              (selectedTrader === 'human' ? humanTrends[index - 1].value : 
                               selectedTrader === 'autonomous' ? autonomousTrends[index - 1].value : 
                               investEaseTrends[index - 1].value) : gameConfig.initialCash;
                            const changePercent = ((point.value - prevValue) / prevValue) * 100;
                            return (
                              <tr key={point.day} className="hover:bg-gray-700">
                                <td className="py-2 px-4 border-b border-gray-700">{point.day}</td>
                                <td className="py-2 px-4 border-b border-gray-700">${point.value.toFixed(2)}</td>
                                <td className={`py-2 px-4 border-b border-gray-700 ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-4 px-4 text-center text-gray-400">
                              No trend data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
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
           {timeLeft <= 0 && (
             <div className="text-lg neon-red mb-2">
               ⏰ TIME'S UP - TRADING DISABLED
             </div>
           )}
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
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                 <div className="flex gap-2 mt-3">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       buyStock(stock, 1);
                     }}
                     disabled={humanCash < stock.price || timeLeft <= 0}
                     className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                   >
                     {timeLeft <= 0 ? '⏰ Time Up' : 'Buy 1'}
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       sellStock(stock, 1);
                     }}
                     disabled={(humanPortfolio[stock.symbol] || 0) < 1 || timeLeft <= 0}
                     className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                   >
                     {timeLeft <= 0 ? '⏰ Time Up' : 'Sell 1'}
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

         {/* Next Phase Button - Only show when time is up */}
         {timeLeft <= 0 && (
           <div className="text-center mt-8">
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleNextPhase}
               className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
             >
               🤖 Start Autonomous AI Turn
             </motion.button>
           </div>
         )}

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
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
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
                    {((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{(((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

         {/* Next Phase Button - Only show when time is up */}
         {timeLeft <= 0 && (
           <div className="text-center mt-8">
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleNextPhase}
               className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
             >
               🏦 Start InvestEase Simulation
             </motion.button>
           </div>
         )}
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
                {((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100 >= 0 ? '+' : ''}{(((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* InvestEase Status */}
        <div className="mb-8 text-center">
          <div className="text-2xl neon-green mb-4">🏦 INVESTEASE SIMULATION</div>
          <div className="text-lg text-white mb-4">RBC InvestEase AI Portfolio Management</div>
          <div className="text-sm text-gray-400 mb-4">
            InvestEase uses its own independent stock market simulator<br/>
            and applies AI-driven portfolio management strategies
          </div>
          <div className="text-lg neon-cyan mb-4">
            Status: {investEaseStrategy || 'Initializing...'}
          </div>
          {investEaseComplete ? (
            <div className="text-lg neon-green mb-4">✅ Simulation Complete!</div>
          ) : (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          )}
        </div>

        {/* InvestEase Simulation Info */}
        <div className="mb-8">
          <h3 className="text-xl neon-cyan mb-4">🏦 INVESTEASE SIMULATION DETAILS</h3>
          <div className="border-4 neon-border-green p-6 rounded-lg" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg neon-blue mb-2">Simulation Method</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-white">• Independent RBC Stock Market Simulator</div>
                  <div className="text-white">• AI-Driven Portfolio Management</div>
                  <div className="text-white">• Strategy: {investEaseStrategy || 'Loading...'}</div>
                  <div className="text-white">• Duration: {gameConfig.timeframe} days</div>
                </div>
              </div>
              <div>
                <h4 className="text-lg neon-blue mb-2">How It Works</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-white">• Creates its own market conditions</div>
                  <div className="text-white">• Applies InvestEase AI algorithms</div>
                  <div className="text-white">• Generates realistic portfolio growth</div>
                  <div className="text-white">• Independent of Human/AI trading</div>
                </div>
              </div>
            </div>
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

        {/* Next Phase Button - Only show when simulation is complete */}
        {investEaseComplete && (
          <div className="text-center mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextPhase}
              className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              📊 View Results
            </motion.button>
          </div>
        )}
      </div>
    );
  }

  // Results Page
  if (battlePhase === 'results') {
    const humanValue = calculateTotalValue(humanPortfolio, humanCash);
    const autonomousValue = calculateTotalValue(autonomousPortfolio, autonomousCash);
    const investEaseValue = calculateTotalValue(investEasePortfolio, investEaseCash);

    // Calculate returns
    const humanReturn = ((humanValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const autonomousReturn = ((autonomousValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;
    const investEaseReturn = ((investEaseValue - gameConfig.initialCash) / gameConfig.initialCash) * 100;

    // Determine winner by highest return percentage
    let winner = 'human';
    let winnerReturn = humanReturn;
    if (autonomousReturn > winnerReturn) {
      winner = 'autonomous';
      winnerReturn = autonomousReturn;
    }
    if (investEaseReturn > winnerReturn) {
      winner = 'investease';
      winnerReturn = investEaseReturn;
    }

    const getWinnerIcon = (trader: string) => {
      if (trader === winner) return '👑';
      return trader === 'human' ? '👤' : trader === 'autonomous' ? '🤖' : '🏦';
    };

    const getWinnerColor = (trader: string) => {
      if (trader === winner) return 'neon-yellow';
      return trader === 'human' ? 'neon-blue' : trader === 'autonomous' ? 'neon-purple' : 'neon-green';
    };

    return (
      <div className="min-h-screen text-white p-6 pt-20" style={{backgroundColor: '#061625'}}>
        <div className="text-center mb-8">
          <h1 className="text-4xl neon-pink mb-4">🏆 BATTLE RESULTS</h1>
          <div className="text-2xl neon-yellow mb-2">
            {winner === 'human' && '👤 HUMAN WINS!'}
            {winner === 'autonomous' && '🤖 AUTONOMOUS AI WINS!'}
            {winner === 'investease' && '🏦 INVESTEASE WINS!'}
          </div>
          <div className="text-lg text-white">
            Highest Return: {winnerReturn >= 0 ? '+' : ''}{winnerReturn.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Human Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border-4 ${winner === 'human' ? 'neon-border-yellow' : 'neon-border-blue'} p-6 rounded-lg cursor-pointer`}
            style={{backgroundColor: winner === 'human' ? 'rgba(255, 249, 0, 0.2)' : 'rgba(0, 225, 255, 0.1)'}}
            onClick={() => setSelectedTrader('human')}
          >
            <div className="text-center">
              <h3 className={`text-2xl ${getWinnerColor('human')} mb-4`}>
                {getWinnerIcon('human')} HUMAN
              </h3>
              <div className="text-3xl neon-yellow mb-2">${humanValue.toFixed(2)}</div>
              <div className={`text-xl ${humanReturn >= 0 ? 'neon-green' : 'neon-red'}`}>
                {humanReturn >= 0 ? '+' : ''}{humanReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-2">Click to view trend graph</div>
            </div>
          </motion.div>

          {/* Autonomous AI Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border-4 ${winner === 'autonomous' ? 'neon-border-yellow' : 'neon-border-purple'} p-6 rounded-lg cursor-pointer`}
            style={{backgroundColor: winner === 'autonomous' ? 'rgba(255, 249, 0, 0.2)' : 'rgba(97, 0, 255, 0.1)'}}
            onClick={() => setSelectedTrader('autonomous')}
          >
            <div className="text-center">
              <h3 className={`text-2xl ${getWinnerColor('autonomous')} mb-4`}>
                {getWinnerIcon('autonomous')} AUTONOMOUS AI
              </h3>
              <div className="text-3xl neon-yellow mb-2">${autonomousValue.toFixed(2)}</div>
              <div className={`text-xl ${autonomousReturn >= 0 ? 'neon-green' : 'neon-red'}`}>
                {autonomousReturn >= 0 ? '+' : ''}{autonomousReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-2">Click to view trend graph</div>
            </div>
          </motion.div>

          {/* InvestEase Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`border-4 ${winner === 'investease' ? 'neon-border-yellow' : 'neon-border-green'} p-6 rounded-lg cursor-pointer`}
            style={{backgroundColor: winner === 'investease' ? 'rgba(255, 249, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)'}}
            onClick={() => setSelectedTrader('investease')}
          >
            <div className="text-center">
              <h3 className={`text-2xl ${getWinnerColor('investease')} mb-4`}>
                {getWinnerIcon('investease')} INVESTEASE
              </h3>
              <div className="text-3xl neon-yellow mb-2">${investEaseValue.toFixed(2)}</div>
              <div className={`text-xl ${investEaseReturn >= 0 ? 'neon-green' : 'neon-red'}`}>
                {investEaseReturn >= 0 ? '+' : ''}{investEaseReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 mt-2">Click to view trend graph</div>
            </div>
          </motion.div>
        </div>

        {/* Final Button */}
        <div className="text-center mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewResults}
            className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xl font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🎉 Complete Battle
          </motion.button>
        </div>

        {/* Trend Graph Modal */}
        {selectedTrader && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border-4 neon-border-blue p-8 rounded-lg shadow-lg w-full max-w-4xl relative text-white"
            >
              <button
                onClick={() => setSelectedTrader(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
              
              <h2 className="text-3xl neon-cyan mb-4 text-center">
                {selectedTrader === 'human' && '👤 HUMAN TRADER'}
                {selectedTrader === 'autonomous' && '🤖 AUTONOMOUS AI'}
                {selectedTrader === 'investease' && '🏦 INVESTEASE'}
                {' '}MONEY TREND
              </h2>
              
              {/* Debug info */}
              <div className="text-sm text-gray-400 mb-4 text-center">
                Data points: {(selectedTrader === 'human' ? humanTrends : 
                  selectedTrader === 'autonomous' ? autonomousTrends : 
                  investEaseTrends).length}
                {selectedTrader === 'investease' && (
                  <div className="mt-2">
                    <div>Strategy: {investEaseStrategy}</div>
                    <div>Simulation Method: {investEaseTrends.length > 0 ? 'RBC InvestEase API' : 'Fallback Growth'}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xl neon-blue mb-2">Performance Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">Starting Value:</span>
                      <span className="text-white">${gameConfig.initialCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Final Value:</span>
                      <span className="text-cyan-400">
                        ${selectedTrader === 'human' ? humanValue.toFixed(2) : 
                          selectedTrader === 'autonomous' ? autonomousValue.toFixed(2) : 
                          investEaseValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Total Return:</span>
                      <span className={`${selectedTrader === 'human' ? humanReturn : 
                        selectedTrader === 'autonomous' ? autonomousReturn : 
                        investEaseReturn} >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedTrader === 'human' ? (humanReturn >= 0 ? '+' : '') + humanReturn.toFixed(2) + '%' : 
                         selectedTrader === 'autonomous' ? (autonomousReturn >= 0 ? '+' : '') + autonomousReturn.toFixed(2) + '%' : 
                         (investEaseReturn >= 0 ? '+' : '') + investEaseReturn.toFixed(2) + '%'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl neon-blue mb-2">Trend Data</h3>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <table className="min-w-full bg-gray-800 rounded-lg">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b border-gray-700 text-left neon-blue">Day</th>
                          <th className="py-2 px-4 border-b border-gray-700 text-left neon-blue">Value</th>
                          <th className="py-2 px-4 border-b border-gray-700 text-left neon-blue">Change (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedTrader === 'human' ? humanTrends : 
                          selectedTrader === 'autonomous' ? autonomousTrends : 
                          investEaseTrends).length > 0 ? (
                          (selectedTrader === 'human' ? humanTrends : 
                            selectedTrader === 'autonomous' ? autonomousTrends : 
                            investEaseTrends).map((point, index) => {
                            const prevValue = index > 0 ? 
                              (selectedTrader === 'human' ? humanTrends[index - 1].value : 
                               selectedTrader === 'autonomous' ? autonomousTrends[index - 1].value : 
                               investEaseTrends[index - 1].value) : gameConfig.initialCash;
                            const changePercent = ((point.value - prevValue) / prevValue) * 100;
                            return (
                              <tr key={point.day} className="hover:bg-gray-700">
                                <td className="py-2 px-4 border-b border-gray-700">{point.day}</td>
                                <td className="py-2 px-4 border-b border-gray-700">${point.value.toFixed(2)}</td>
                                <td className={`py-2 px-4 border-b border-gray-700 ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-4 px-4 text-center text-gray-400">
                              No trend data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }
}

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { SimpleTradingGame } from './SimpleTradingGame';
import { VSScreen } from './VSScreen';
import { ResultsScreen } from './ResultsScreen';
import { GameConfig } from './GameSetup';
import { useAuthContext } from '../contexts/AuthContext';

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
  winner: 'human' | 'autonomousAI' | 'investEase';
}

interface OneVOneVOneBattleProps {
  gameConfig: GameConfig;
  onBattleComplete: (results: BattleResults) => void;
}

export function OneVOneVOneBattle({ gameConfig, onBattleComplete }: OneVOneVOneBattleProps) {
  const [battlePhase, setBattlePhase] = useState<'setup' | 'human' | 'vs1' | 'autonomous' | 'vs2' | 'investease' | 'vs3' | 'results' | 'complete'>('setup');
  const [humanValue, setHumanValue] = useState(0);
  const [autonomousValue, setAutonomousValue] = useState(0);
  const [investEaseValue, setInvestEaseValue] = useState(0);
  const [investEaseStrategy, setInvestEaseStrategy] = useState('');
  const [battleResults, setBattleResults] = useState<BattleResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { updateGameStats } = useAuthContext();

  const startHumanRound = () => {
    console.log('👤 Starting human round...');
    setBattlePhase('human');
  };

  const handleHumanComplete = (score: number) => {
    console.log('👤 Human round complete:', score);
    setHumanValue(score);
    setBattlePhase('vs1');
  };

  const handleVS1Complete = () => {
    console.log('⚡ VS1 complete, starting autonomous AI round...');
    setBattlePhase('autonomous');
  };

  const handleAutonomousComplete = (score: number) => {
    console.log('🤖 Autonomous AI round complete:', score);
    setAutonomousValue(score);
    setBattlePhase('vs2');
  };

  const handleVS2Complete = () => {
    console.log('⚡ VS2 complete, starting InvestEase round...');
    setBattlePhase('investease');
  };

  const handleInvestEaseComplete = async (score: number) => {
    console.log('🏦 InvestEase round complete:', score);
    setInvestEaseValue(score);
    setInvestEaseStrategy('RBC InvestEase AI Portfolio Management');
    setBattlePhase('vs3');
  };

  const handleVS3Complete = async () => {
    console.log('⚡ VS3 complete, calculating final results...');
    
    // Determine winner
    let winner: 'human' | 'autonomousAI' | 'investEase' = 'human';
    if (autonomousValue > humanValue && autonomousValue > investEaseValue) {
      winner = 'autonomousAI';
    } else if (investEaseValue > humanValue && investEaseValue > autonomousValue) {
      winner = 'investEase';
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
    const playerWon = winner === 'human';
    await updateGameStats({
      score: humanValue,
      won: playerWon,
      gameType: '1v1v1-battle',
      rounds: 1,
      aiScore: autonomousValue,
      investEaseScore: investEaseValue,
      humanReturn: results.human.totalReturn,
      aiReturn: results.autonomousAI.totalReturn,
      investEaseReturn: results.investEase.totalReturn,
      timestamp: new Date().toISOString()
    });

    // Save game session to MongoDB
    try {
      const token = localStorage.getItem('game_token');
      if (token) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/game-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId: `1v1v1_battle_${Date.now()}`,
            gameType: '1v1v1-battle',
            finalScore: humanValue,
            aiScore: autonomousValue,
            investEaseScore: investEaseValue,
            won: playerWon,
            winner: winner,
            humanReturn: results.human.totalReturn,
            aiReturn: results.autonomousAI.totalReturn,
            investEaseReturn: results.investEase.totalReturn,
            duration: (gameConfig.timeframe || 7) * 5 * 1000,
            completedAt: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          console.log('✅ 1v1v1 battle session saved to MongoDB');
        }
      }
    } catch (error) {
      console.error('Error saving 1v1v1 battle session:', error);
    }

    setTimeout(() => {
      onBattleComplete(results);
    }, 3000);
  };

  const getBattleStatus = () => {
    switch (battlePhase) {
      case 'setup':
        return 'PREPARE FOR BATTLE';
      case 'human':
        return 'HUMAN TRADER';
      case 'vs1':
        return 'HUMAN vs AUTONOMOUS AI';
      case 'autonomous':
        return 'AUTONOMOUS AI';
      case 'vs2':
        return 'AUTONOMOUS AI vs INVESTEASE';
      case 'investease':
        return 'INVESTEASE AI';
      case 'vs3':
        return 'FINAL RESULTS';
      case 'results':
        return 'BATTLE COMPLETE';
      default:
        return 'BATTLE COMPLETE';
    }
  };

  const getCurrentPhase = () => {
    switch (battlePhase) {
      case 'setup':
        return { phase: 0, total: 6, description: 'Setup' };
      case 'human':
        return { phase: 1, total: 6, description: 'Human Trading' };
      case 'vs1':
        return { phase: 2, total: 6, description: 'Human vs AI' };
      case 'autonomous':
        return { phase: 3, total: 6, description: 'Autonomous AI Trading' };
      case 'vs2':
        return { phase: 4, total: 6, description: 'AI vs InvestEase' };
      case 'investease':
        return { phase: 5, total: 6, description: 'InvestEase Trading' };
      case 'vs3':
      case 'results':
        return { phase: 6, total: 6, description: 'Final Results' };
      default:
        return { phase: 6, total: 6, description: 'Complete' };
    }
  };

  if (battlePhase === 'setup') {
    const currentPhase = getCurrentPhase();
    
    return (
      <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font" style={{backgroundColor: '#061625'}}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-6xl mx-auto p-8"
        >
          {/* Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="text-6xl mb-4 neon-pink">
              🏆 1v1v1 BATTLE
            </div>
            <div className="text-2xl neon-blue">
              HUMAN vs AUTONOMOUS AI vs INVESTEASE
            </div>
          </motion.div>

          {/* Battle Description */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-4 neon-border-blue p-8 mb-8" style={{backgroundColor: 'rgba(6, 22, 37, 0.8)'}}
          >
            <h2 className="text-3xl mb-6 neon-yellow">BATTLE FORMAT</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="border-2 neon-border-green p-4" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
                <div className="text-2xl mb-2">👤 HUMAN TRADER</div>
                <div className="text-sm text-white">
                  You trade first! Watch the market and make strategic decisions to build your portfolio.
                </div>
              </div>
              <div className="border-2 neon-border-purple p-4" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
                <div className="text-2xl mb-2">🤖 AUTONOMOUS AI</div>
                <div className="text-sm text-white">
                  AI trades second! Uses intelligent algorithms to buy low and sell high automatically.
                </div>
              </div>
              <div className="border-2 neon-border-yellow p-4" style={{backgroundColor: 'rgba(255, 255, 0, 0.1)'}}>
                <div className="text-2xl mb-2">🏦 INVESTEASE AI</div>
                <div className="text-sm text-white">
                  Professional AI trades last! Uses RBC InvestEase simulation for optimal performance.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Game Config Display */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="border-4 neon-border-yellow p-6 mb-8" style={{backgroundColor: 'rgba(255, 249, 0, 0.1)'}}
          >
            <h3 className="text-2xl mb-4 neon-yellow">BATTLE PARAMETERS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong className="neon-blue">GOAL:</strong><br />
                {gameConfig.goal}
              </div>
              <div>
                <strong className="neon-pink">TARGET:</strong><br />
                ${gameConfig.cost.toLocaleString()}
              </div>
              <div>
                <strong className="neon-yellow">DURATION:</strong><br />
                {gameConfig.timeframe} days each
              </div>
              <div>
                <strong className="neon-green">STARTING CASH:</strong><br />
                ${gameConfig.initialCash.toLocaleString()}
              </div>
            </div>
          </motion.div>

          {/* Battle Progress */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border-4 neon-border-cyan p-6 mb-8" style={{backgroundColor: 'rgba(0, 255, 255, 0.1)'}}
          >
            <h3 className="text-2xl mb-4 neon-cyan">BATTLE PROGRESS</h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step <= currentPhase.phase ? 'bg-yellow-400 text-black' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {step}
                  </div>
                  <div className="text-xs mt-1 text-center">
                    {step === 1 ? 'Human' : 
                     step === 2 ? 'VS' : 
                     step === 3 ? 'AI' : 
                     step === 4 ? 'VS' : 
                     step === 5 ? 'InvestEase' : 'Results'}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-white">
              {currentPhase.description} ({currentPhase.phase}/{currentPhase.total})
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={startHumanRound}
              className="border-4 neon-border-yellow text-black pixel-font text-3xl px-12 py-6 bg-yellow-400 hover:bg-yellow-300 transition-all duration-300"
              style={{backgroundColor: '#fff900'}}
            >
              🥊 START BATTLE
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (battlePhase === 'human') {
    return (
      <SimpleTradingGame
        gameConfig={gameConfig}
        isAITurn={false}
        onComplete={handleHumanComplete}
        roundNumber={1}
        timeFrame={gameConfig.timeframe || 7}
      />
    );
  }

  if (battlePhase === 'vs1') {
    return (
      <VSScreen 
        onComplete={handleVS1Complete}
        playerScore={humanValue}
        aiScore={0}
        roundNumber={1}
      />
    );
  }

  if (battlePhase === 'autonomous') {
    return (
      <SimpleTradingGame
        gameConfig={gameConfig}
        isAITurn={true}
        onComplete={handleAutonomousComplete}
        roundNumber={2}
        timeFrame={gameConfig.timeframe || 7}
      />
    );
  }

  if (battlePhase === 'vs2') {
    return (
      <VSScreen 
        onComplete={handleVS2Complete}
        playerScore={autonomousValue}
        aiScore={0}
        roundNumber={2}
      />
    );
  }

  if (battlePhase === 'investease') {
    return (
      <SimpleTradingGame
        gameConfig={gameConfig}
        isAITurn={true}
        onComplete={handleInvestEaseComplete}
        roundNumber={3}
        timeFrame={gameConfig.timeframe || 7}
      />
    );
  }

  if (battlePhase === 'vs3') {
    return (
      <VSScreen 
        onComplete={handleVS3Complete}
        playerScore={investEaseValue}
        aiScore={0}
        roundNumber={3}
      />
    );
  }

  if (battlePhase === 'results' && battleResults) {
    const getWinnerDisplay = (winner: string) => {
      switch (winner) {
        case 'human':
          return { emoji: '👤', text: 'HUMAN WINS!', color: 'text-green-400' };
        case 'autonomousAI':
          return { emoji: '🤖', text: 'AUTONOMOUS AI WINS!', color: 'text-purple-400' };
        case 'investEase':
          return { emoji: '🏦', text: 'INVESTEASE WINS!', color: 'text-yellow-400' };
        default:
          return { emoji: '🤝', text: 'DRAW!', color: 'text-gray-400' };
      }
    };

    const winnerDisplay = getWinnerDisplay(battleResults.winner);
    
    return (
      <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font" style={{backgroundColor: '#061625'}}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-6xl mx-auto p-8"
        >
          {/* Winner Display */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="text-6xl mb-4">
              {winnerDisplay.emoji}
            </div>
            <div className={`text-4xl font-bold mb-4 ${winnerDisplay.color}`}>
              {winnerDisplay.text}
            </div>
            <div className="text-xl neon-blue">
              BATTLE COMPLETE
            </div>
          </motion.div>

          {/* Results Grid */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Human Results */}
            <div className={`border-4 p-6 rounded-lg ${battleResults.winner === 'human' ? 'neon-border-green' : 'neon-border-gray'}`} 
                 style={{backgroundColor: battleResults.winner === 'human' ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)'}}>
              <div className="text-2xl mb-2">👤 HUMAN TRADER</div>
              <div className="text-3xl font-bold text-white mb-2">${battleResults.human.finalValue.toFixed(2)}</div>
              <div className={`text-lg ${battleResults.human.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {battleResults.human.totalReturn >= 0 ? '+' : ''}{battleResults.human.totalReturn.toFixed(2)}%
              </div>
            </div>

            {/* Autonomous AI Results */}
            <div className={`border-4 p-6 rounded-lg ${battleResults.winner === 'autonomousAI' ? 'neon-border-purple' : 'neon-border-gray'}`} 
                 style={{backgroundColor: battleResults.winner === 'autonomousAI' ? 'rgba(97, 0, 255, 0.2)' : 'rgba(97, 0, 255, 0.1)'}}>
              <div className="text-2xl mb-2">🤖 AUTONOMOUS AI</div>
              <div className="text-3xl font-bold text-white mb-2">${battleResults.autonomousAI.finalValue.toFixed(2)}</div>
              <div className={`text-lg ${battleResults.autonomousAI.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {battleResults.autonomousAI.totalReturn >= 0 ? '+' : ''}{battleResults.autonomousAI.totalReturn.toFixed(2)}%
              </div>
            </div>

            {/* InvestEase Results */}
            <div className={`border-4 p-6 rounded-lg ${battleResults.winner === 'investEase' ? 'neon-border-yellow' : 'neon-border-gray'}`} 
                 style={{backgroundColor: battleResults.winner === 'investEase' ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 0, 0.1)'}}>
              <div className="text-2xl mb-2">🏦 INVESTEASE AI</div>
              <div className="text-3xl font-bold text-white mb-2">${battleResults.investEase.finalValue.toFixed(2)}</div>
              <div className={`text-lg ${battleResults.investEase.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {battleResults.investEase.totalReturn >= 0 ? '+' : ''}{battleResults.investEase.totalReturn.toFixed(2)}%
              </div>
              <div className="text-sm text-white mt-2">
                Strategy: {battleResults.investEase.strategy}
              </div>
            </div>
          </motion.div>

          {/* Performance Analysis */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="border-4 neon-border-cyan p-6 mb-8" style={{backgroundColor: 'rgba(0, 255, 255, 0.1)'}}
          >
            <h3 className="text-2xl mb-4 neon-cyan">PERFORMANCE ANALYSIS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong className="neon-cyan">📊 BEST PERFORMER:</strong><br />
                <span className="text-white">
                  {battleResults.winner === 'human' ? 'Human Trader' :
                   battleResults.winner === 'autonomousAI' ? 'Autonomous AI' : 'InvestEase AI'}
                </span>
              </div>
              <div>
                <strong className="neon-cyan">💰 TOTAL VALUE DIFFERENCE:</strong><br />
                <span className="text-white">
                  ${Math.abs(battleResults.human.finalValue - battleResults.autonomousAI.finalValue).toFixed(2)} between Human and AI
                </span>
              </div>
              <div>
                <strong className="neon-cyan">🎯 PROFESSIONAL VS RETAIL:</strong><br />
                <span className="text-white">
                  InvestEase: {battleResults.investEase.totalReturn.toFixed(2)}% | 
                  Human: {battleResults.human.totalReturn.toFixed(2)}%
                </span>
              </div>
              <div>
                <strong className="neon-cyan">🤖 AI COMPARISON:</strong><br />
                <span className="text-white">
                  Autonomous: {battleResults.autonomousAI.totalReturn.toFixed(2)}% | 
                  InvestEase: {battleResults.investEase.totalReturn.toFixed(2)}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Restart Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setBattlePhase('setup')}
              className="border-4 neon-border-pink text-white pixel-font text-2xl px-8 py-4 hover:opacity-80 transition-all duration-300"
              style={{backgroundColor: 'rgba(255, 0, 233, 0.2)'}}
            >
              🔄 BATTLE AGAIN
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return null;
}

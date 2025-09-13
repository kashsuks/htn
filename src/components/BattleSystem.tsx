import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SimpleTradingGame } from './SimpleTradingGame';
import { VSScreen } from './VSScreen';
import { ResultsScreen } from './ResultsScreen';
import { GameConfig } from './GameSetup';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';

interface RoundResult {
  round: number;
  playerScore: number;
  aiScore: number;
  winner: 'player' | 'ai' | 'tie';
}

interface BattleSystemProps {
  gameConfig: GameConfig;
  onBattleComplete: (results: RoundResult[]) => void;
}

type BattlePhase = 'setup' | 'player' | 'vs' | 'ai' | 'results' | 'complete';

export function BattleSystem({ gameConfig, onBattleComplete }: BattleSystemProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [battlePhase, setBattlePhase] = useState('setup' as BattlePhase);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [currentPlayerValue, setCurrentPlayerValue] = useState(0);
  const [currentAIValue, setCurrentAIValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [battleStartTime, setBattleStartTime] = useState<number>(0);
  const { updateGameStats } = useAuthContext();
  const { getAccessTokenSilently } = useAuth0();

  const MAX_ROUNDS = 3;

  const startPlayerRound = () => {
    console.log('🎮 Starting player round:', currentRound);
    setBattlePhase('player');
    setCurrentPlayerValue(0);
    
    // Track battle start time for the first round
    if (currentRound === 1) {
      setBattleStartTime(Date.now());
    }
  };

  const handlePlayerComplete = (score: number) => {
    console.log('🎮 Player round complete:', { score, round: currentRound });
    setCurrentPlayerValue(score);
    setBattlePhase('vs');
  };

  const handleVSComplete = () => {
    console.log('⚡ VS screen complete, starting AI round:', currentRound);
    setBattlePhase('ai');
    // Don't reset currentAIValue here - keep the previous value until AI completes
  };

  const handleAIComplete = async (score: number) => {
    console.log('🤖 AI round complete:', { score, playerScore: currentPlayerValue, round: currentRound });
    setCurrentAIValue(score);
    
    // Determine round winner - higher portfolio value wins
    const winner = score > currentPlayerValue ? 'ai' : 
                   currentPlayerValue > score ? 'player' : 'tie';
    
    console.log('🏆 Round winner determined:', { winner, playerScore: currentPlayerValue, aiScore: score, difference: Math.abs(score - currentPlayerValue) });
    
    const roundResult: RoundResult = {
      round: currentRound,
      playerScore: currentPlayerValue,
      aiScore: score,
      winner
    };

    const newResults = [...roundResults, roundResult];
    setRoundResults(newResults);

    // Update overall scores
    if (winner === 'player') {
      setPlayerScore(prev => {
        const newScore = prev + 1;
        console.log('👤 Player wins round! New score:', newScore);
        return newScore;
      });
    } else if (winner === 'ai') {
      setAiScore(prev => {
        const newScore = prev + 1;
        console.log('🤖 AI wins round! New score:', newScore);
        return newScore;
      });
    }

    setBattlePhase('results');

    // Check if battle is complete
    setTimeout(() => {
      const newPlayerScore = winner === 'player' ? playerScore + 1 : playerScore;
      const newAiScore = winner === 'ai' ? aiScore + 1 : aiScore;
      
      console.log('📊 Battle status check:', { 
        currentRound, 
        maxRounds: MAX_ROUNDS, 
        newPlayerScore, 
        newAiScore,
        battleComplete: currentRound >= MAX_ROUNDS || newPlayerScore >= 2 || newAiScore >= 2
      });
      
      if (currentRound >= MAX_ROUNDS || newPlayerScore >= 2 || newAiScore >= 2) {
        console.log('🏁 Battle complete!', { currentRound, newPlayerScore, newAiScore });
        setBattlePhase('complete');
        
        // Update game stats
        const finalPlayerScore = newResults.reduce((sum, result) => sum + result.playerScore, 0) / newResults.length;
        const finalAiScore = newResults.reduce((sum, result) => sum + result.aiScore, 0) / newResults.length;
        const playerWon = newPlayerScore > newAiScore;
        
        // Update game stats
        await updateGameStats({
          score: finalPlayerScore,
          won: playerWon,
          gameType: 'battle',
          rounds: newResults.length,
          aiScore: finalAiScore,
          timestamp: new Date().toISOString()
        });

        // Save game session to MongoDB
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/game-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAccessTokenSilently()}`
            },
            body: JSON.stringify({
              sessionId: `battle_${Date.now()}`,
              gameType: 'battle',
              rounds: newResults.length,
              finalScore: finalPlayerScore,
              aiScore: finalAiScore,
              won: playerWon,
              roundResults: newResults,
              duration: Date.now() - battleStartTime,
              completedAt: new Date().toISOString()
            })
          });
          
          if (response.ok) {
            console.log('✅ Game session saved to MongoDB');
          }
        } catch (error) {
          console.error('Error saving game session:', error);
        }
        
        onBattleComplete(newResults);
      } else {
        // Start next round
        console.log('🔄 Starting next round:', currentRound + 1);
        setCurrentRound(prev => prev + 1);
        setBattlePhase('setup');
      }
    }, 3000);
  };

  const getBattleStatus = () => {
    if (battlePhase === 'complete') {
      if (playerScore > aiScore) return 'VICTORY!';
      if (aiScore > playerScore) return 'DEFEAT!';
      return 'DRAW!';
    }
    return `ROUND ${currentRound} OF ${MAX_ROUNDS}`;
  };

  const getOverallWinner = () => {
    if (playerScore > aiScore) return 'player';
    if (aiScore > playerScore) return 'ai';
    return 'tie';
  };

  if (battlePhase === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font" style={{backgroundColor: '#061625'}}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto p-8"
        >
          {/* Round Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="text-6xl mb-4 neon-pink">
              {getBattleStatus()}
            </div>
            <div className="text-2xl neon-blue">
              {battlePhase === 'complete' ? 'BATTLE COMPLETE' : 'PREPARE FOR BATTLE'}
            </div>
          </motion.div>

          {/* Battle Progress */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-4 neon-border-blue p-8 mb-8" style={{backgroundColor: 'rgba(6, 22, 37, 0.8)'}}
          >
            <h2 className="text-3xl mb-6 neon-yellow">BATTLE PROGRESS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((round) => (
                <div key={round} className="text-center">
                  <div className={`text-4xl mb-2 ${round <= currentRound ? 'neon-yellow' : 'text-gray-500'}`}>
                    {round <= currentRound ? '🥊' : '⭕'}
                  </div>
                  <div className={`text-xl font-bold ${round <= currentRound ? 'neon-blue' : 'text-gray-500'}`}>
                    ROUND {round}
                  </div>
                  {round < currentRound && roundResults[round - 1] && (
                    <div className="text-sm mt-2">
                      <div className={`${roundResults[round - 1].winner === 'player' ? 'text-green-400' : 
                                       roundResults[round - 1].winner === 'ai' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {roundResults[round - 1].winner === 'player' ? '👤 WON' : 
                         roundResults[round - 1].winner === 'ai' ? '🤖 WON' : 'TIE'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Current Score */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-8 mb-8"
          >
            <div className="border-4 neon-border-pink p-6" style={{backgroundColor: 'rgba(255, 0, 233, 0.1)'}}>
              <div className="text-3xl mb-2">👤</div>
              <div className="text-4xl font-bold neon-pink">{playerScore}</div>
              <div className="text-lg">PLAYER WINS</div>
            </div>
            <div className="border-4 neon-border-blue p-6" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-4xl font-bold neon-blue">{aiScore}</div>
              <div className="text-lg">AI WINS</div>
            </div>
          </motion.div>

          {/* Game Config Display */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
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
                <strong className="neon-yellow">TIME:</strong><br />
                {gameConfig.timeframe} days
              </div>
              <div>
                <strong className="neon-green">START:</strong><br />
                ${gameConfig.initialCash.toLocaleString()}
              </div>
            </div>
          </motion.div>

          {/* Start Button */}
          {battlePhase !== 'complete' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={startPlayerRound}
                className="border-4 neon-border-yellow text-black pixel-font text-3xl px-12 py-6 bg-yellow-400 hover:bg-yellow-300 transition-all duration-300"
                style={{backgroundColor: '#fff900'}}
              >
                🥊 START ROUND {currentRound}
              </button>
            </motion.div>
          )}

          {/* Final Results */}
          {battlePhase === 'complete' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <div className={`text-4xl font-bold mb-4 ${
                getOverallWinner() === 'player' ? 'text-green-400' : 
                getOverallWinner() === 'ai' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {getOverallWinner() === 'player' ? '🏆 VICTORY!' : 
                 getOverallWinner() === 'ai' ? '💀 DEFEAT!' : '🤝 DRAW!'}
              </div>
              <div className="text-xl neon-blue">
                Final Score: {playerScore} - {aiScore}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  if (battlePhase === 'player') {
    return (
      <SimpleTradingGame
        gameConfig={gameConfig}
        isAITurn={false}
        onComplete={handlePlayerComplete}
        roundNumber={currentRound}
      />
    );
  }

  if (battlePhase === 'vs') {
    return (
      <VSScreen 
        onComplete={handleVSComplete}
        playerScore={currentPlayerValue}
        aiScore={0}
        roundNumber={currentRound}
      />
    );
  }

  if (battlePhase === 'ai') {
    return (
      <SimpleTradingGame
        gameConfig={gameConfig}
        isAITurn={true}
        onComplete={handleAIComplete}
        roundNumber={currentRound}
      />
    );
  }

  if (battlePhase === 'results') {
    return (
      <ResultsScreen
        playerScore={currentPlayerValue}
        aiScore={currentAIValue}
        onRestart={() => {}} // Handled by battle system
        roundNumber={currentRound}
        isFinalRound={currentRound >= MAX_ROUNDS}
        overallWinner={getOverallWinner()}
      />
    );
  }

  return null;
}

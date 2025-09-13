import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameSetup, GameConfig } from './components/GameSetup';
import { BattleSystem } from './components/BattleSystem';
import { Button } from './components/ui/button';
import { gameApi } from './services/gameApi';

type GamePhase = 'start' | 'setup' | 'battle' | 'complete';

interface RoundResult {
  round: number;
  playerScore: number;
  aiScore: number;
  winner: 'player' | 'ai' | 'tie';
}

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('start');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [battleResults, setBattleResults] = useState<RoundResult[]>([]);

  // Initialize game state
  useEffect(() => {
    gameApi.initializeFromStorage();
  }, []);

  const startGame = () => {
    setGamePhase('setup');
  };

  const handleGameSetup = (config: GameConfig) => {
    setGameConfig(config);
    setGamePhase('battle');
  };

  const handleBattleComplete = (results: RoundResult[]) => {
    setBattleResults(results);
    setGamePhase('complete');
  };

  const restartGame = () => {
    setGamePhase('start');
    setGameConfig(null);
    setBattleResults([]);
    gameApi.clearAuth();
  };

  if (gamePhase === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font" style={{backgroundColor: '#061625'}}>
        <div className="text-center max-w-4xl mx-auto p-8">
          {/* Title */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            className="mb-12"
          >
            <div className="text-8xl mb-4 neon-pink">
              STOCK FIGHTER
            </div>
            <div className="text-2xl neon-blue">
              THE ULTIMATE TRADING BATTLE ARENA
            </div>
          </motion.div>

          {/* Game Description */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="border-4 neon-border-blue p-8 mb-8" style={{backgroundColor: 'rgba(6, 22, 37, 0.8)'}}
          >
            <h2 className="text-3xl mb-6 neon-yellow">HOW TO PLAY</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <strong className="neon-blue">SETUP:</strong> Choose your investment goal, timeframe, and target amount
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <strong className="neon-blue">REAL-TIME:</strong> 1 second = 0.5 days in game time
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <strong className="neon-yellow">BATTLE:</strong> Best of 3 rounds vs RBC InvestEase AI
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <strong className="neon-yellow">VICTORY:</strong> Reach your goal faster than the AI!
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            <div className="border-2 neon-border-blue p-4" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
              <div className="text-3xl mb-2">📈</div>
              <div className="pixel-font">RBC API</div>
            </div>
            <div className="border-2 neon-border-pink p-4" style={{backgroundColor: 'rgba(255, 0, 233, 0.1)'}}>
              <div className="text-3xl mb-2">🎯</div>
              <div className="pixel-font">GOAL SETTING</div>
            </div>
            <div className="border-2 neon-border-yellow p-4" style={{backgroundColor: 'rgba(255, 249, 0, 0.1)'}}>
              <div className="text-3xl mb-2">⚡</div>
              <div className="pixel-font">REAL-TIME</div>
            </div>
            <div className="border-2 neon-border-purple p-4" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
              <div className="text-3xl mb-2">🥊</div>
              <div className="pixel-font">BEST OF 3</div>
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
          >
            <Button
              onClick={startGame}
              size="lg"
              className="border-4 neon-border-yellow text-black pixel-font text-3xl px-12 py-6 bg-yellow-400 hover:bg-yellow-300"
              style={{backgroundColor: '#fff900'}}
            >
              🥊 START BATTLE
            </Button>
          </motion.div>

          {/* Floating animations */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute top-20 left-20 text-6xl opacity-30"
          >
            💰
          </motion.div>
          
          <motion.div
            animate={{ 
              y: [0, 15, 0],
              x: [0, 10, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute top-32 right-32 text-5xl opacity-30"
          >
            📊
          </motion.div>
          
          <motion.div
            animate={{ 
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 left-32 text-4xl opacity-30"
          >
            ⚡
          </motion.div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'setup') {
    return <GameSetup onGameStart={handleGameSetup} />;
  }

  if (gamePhase === 'battle' && gameConfig) {
    return (
      <BattleSystem 
        gameConfig={gameConfig} 
        onBattleComplete={handleBattleComplete} 
      />
    );
  }

  if (gamePhase === 'complete') {
    const playerWins = battleResults.filter(r => r.winner === 'player').length;
    const aiWins = battleResults.filter(r => r.winner === 'ai').length;
    const finalWinner = playerWins > aiWins ? 'player' : aiWins > playerWins ? 'ai' : 'tie';
    
    return (
      <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font" style={{backgroundColor: '#061625'}}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto p-8"
        >
          <div className={`text-8xl mb-8 ${
            finalWinner === 'player' ? 'text-green-400' : 
            finalWinner === 'ai' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {finalWinner === 'player' ? '🏆 VICTORY!' : 
             finalWinner === 'ai' ? '💀 DEFEAT!' : '🤝 DRAW!'}
          </div>
          
          <div className="text-3xl mb-8 neon-blue">
            FINAL SCORE: {playerWins} - {aiWins}
          </div>

          <div className="border-4 neon-border-yellow p-8 mb-8" style={{backgroundColor: 'rgba(6, 22, 37, 0.8)'}}>
            <h3 className="text-2xl mb-6 neon-yellow">BATTLE SUMMARY</h3>
            <div className="space-y-4">
              {battleResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-4 border-2 border-gray-600 rounded">
                  <div className="text-lg">Round {result.round}</div>
                  <div className="text-lg">
                    ${result.playerScore.toLocaleString()} vs ${result.aiScore.toLocaleString()}
                  </div>
                  <div className={`font-bold ${
                    result.winner === 'player' ? 'text-green-400' : 
                    result.winner === 'ai' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {result.winner === 'player' ? '👤 WON' : 
                     result.winner === 'ai' ? '🤖 WON' : 'TIE'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={restartGame}
            size="lg"
            className="border-4 neon-border-yellow text-black pixel-font text-3xl px-12 py-6 bg-yellow-400 hover:bg-yellow-300"
            style={{backgroundColor: '#fff900'}}
          >
            🔄 PLAY AGAIN
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
}
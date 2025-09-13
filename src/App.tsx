import { useState } from 'react';
import { motion } from 'motion/react';
import { StockTradingGame } from './components/StockTradingGame';
import { VSScreen } from './components/VSScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { Button } from './components/ui/button';

type GamePhase = 'start' | 'player' | 'vs' | 'ai' | 'results';

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('start');
  const [playerScore, setPlayerScore] = useState(10000);
  const [aiScore, setAiScore] = useState(10000);

  const startGame = () => {
    setGamePhase('player');
    setPlayerScore(10000);
    setAiScore(10000);
  };

  const handlePlayerComplete = (score: number) => {
    setPlayerScore(score);
    setGamePhase('vs');
  };

  const handleVSComplete = () => {
    setGamePhase('ai');
  };

  const handleAIComplete = (score: number) => {
    // AI gets a slight advantage by making it perform 10-15% better
    const enhancedScore = score * (1.1 + Math.random() * 0.05);
    setAiScore(enhancedScore);
    setGamePhase('results');
  };

  const restartGame = () => {
    setGamePhase('start');
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
            <div className="text-4xl neon-blue font-normal">
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
                    <strong className="neon-blue">ROUND 1:</strong> You have 30 seconds to trade stocks and maximize your portfolio value
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <strong className="neon-blue">DYNAMIC MARKET:</strong> Watch breaking news and character announcements that affect stock prices
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <strong className="neon-yellow">ROUND 2:</strong> AI Trader takes its turn with the same market conditions
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <strong className="neon-yellow">VICTORY:</strong> Highest portfolio value wins the battle!
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {/* How to Play Button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, duration: 0.3 }}
            >
              <Button
                // onClick={startGame}
                size="lg"
                className="border-4 neon-border-purple text-white pixel-font text-3xl px-12 py-6 bg-purple-400 hover:bg-purple-300"
                style={{backgroundColor: '#6100ff'}}
              >
                How to play
              </Button>
            </motion.div>

            {/* Leaderboard Button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, duration: 0.3 }}
            >
              <Button
                // onClick={startGame}
                size="lg"
                className="border-4 neon-border-purple text-white pixel-font text-3xl px-12 py-6 bg-purple-400 hover:bg-purple-300"
                style={{backgroundColor: '#6100ff'}}
              >
                Leaderboard
              </Button>
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
                START BATTLE
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'player') {
    return <StockTradingGame isAITurn={false} onComplete={handlePlayerComplete} />;
  }

  if (gamePhase === 'vs') {
    return <VSScreen onComplete={handleVSComplete} />;
  }

  if (gamePhase === 'ai') {
    return <StockTradingGame isAITurn={true} onComplete={handleAIComplete} />;
  }

  if (gamePhase === 'results') {
    return (
      <ResultsScreen 
        playerScore={playerScore} 
        aiScore={aiScore} 
        onRestart={restartGame} 
      />
    );
  }

  return null;
}
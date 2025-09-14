import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'motion/react';
import { GameSetup, GameConfig } from './components/GameSetup';
import { BattleSystem } from './components/BattleSystem';
import { Button } from './components/ui/button';
import { gameApi } from './services/gameApi';
import { AuthProvider } from './contexts/AuthContext';
import LoginButton from './components/auth/LoginButton';
import LogoutButton from './components/auth/LogoutButton';
import UserProfile from './components/auth/UserProfile';
import ProtectedRoute from './components/auth/ProtectedRoute';

type GamePhase = 'start' | 'setup' | 'battle' | 'complete';

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

// Navigation Header Component
const NavigationHeader: React.FC = () => {
  const { isAuthenticated, user } = useAuth0();
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="text-2xl font-bold text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors"
          onClick={() => navigate('/')}
        >
          🚀 STOCK FIGHTER
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/profile')}
                className="text-white hover:text-yellow-400"
              >
                👤 Profile
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/game')}
                className="text-white hover:text-yellow-400"
              >
                🎮 Play Game
              </Button>
              <div className="flex items-center gap-2">
                <img
                  src={user?.picture}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white">{user?.name}</span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </div>
  );
};

// Game Component
const GameComponent: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('start');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [battleResults, setBattleResults] = useState<BattleResults | null>(null);
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // Initialize game state
  useEffect(() => {
    gameApi.initializeFromStorage();
  }, []);

  const startGame = () => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    setGamePhase('setup');
  };

  const handleGameSetup = (config: GameConfig) => {
    setGameConfig(config);
    setGamePhase('battle');
  };

  const handleBattleComplete = (results: BattleResults) => {
    setBattleResults(results);
    setGamePhase('complete');
  };

  const restartGame = () => {
    setGamePhase('start');
    setGameConfig(null);
    setBattleResults(null);
    gameApi.clearAuth();
  };

  if (gamePhase === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font pt-20" style={{backgroundColor: '#061625'}}>
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
                    <strong className="neon-blue">REAL-TIME:</strong> 5 seconds = 1 day in game time
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <strong className="neon-blue">WATCH:</strong> Stock prices update automatically every 5 seconds
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <strong className="neon-yellow">BATTLE:</strong> Best of 3 rounds vs AI opponent
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <strong className="neon-yellow">GOAL:</strong> Build the highest portfolio value in 7 days
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <strong className="neon-yellow">VICTORY:</strong> Beat the AI's final portfolio value!
                  </div>
                </div>
              </div>
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

  if (gamePhase === 'complete' && battleResults) {
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
      <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font pt-20" style={{backgroundColor: '#061625'}}>
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
};

// Home Page Component
const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center text-white scanlines pixel-font pt-20" style={{backgroundColor: '#061625'}}>
      <div className="text-center max-w-4xl mx-auto p-8">
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

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="border-4 neon-border-blue p-8 mb-8" style={{backgroundColor: 'rgba(6, 22, 37, 0.8)'}}
        >
          <h2 className="text-3xl mb-6 neon-yellow">WELCOME TO THE ARENA</h2>
          <p className="text-xl mb-6">
            Battle against RBC InvestEase AI in real-time trading competitions. 
            Track your progress, earn achievements, and climb the leaderboard!
          </p>
          
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/game')}
                  size="lg"
                  className="border-4 neon-border-yellow text-black pixel-font text-2xl px-8 py-4 bg-yellow-400 hover:bg-yellow-300"
                >
                  🥊 START BATTLE
                </Button>
                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  size="lg"
                  className="border-4 neon-border-blue text-blue-400 pixel-font text-xl px-8 py-4"
                >
                  👤 VIEW PROFILE
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-300">
                  Sign in to track your progress and compete on the leaderboard!
                </p>
                <LoginButton />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Main App Component with Routes
export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <NavigationHeader />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/game" 
            element={
              <ProtectedRoute>
                <GameComponent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}
import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';

interface ResultsScreenProps {
  playerScore: number;
  aiScore: number;
  onRestart: () => void;
  roundNumber?: number;
  isFinalRound?: boolean;
  overallWinner?: 'player' | 'ai' | 'tie';
}

export function ResultsScreen({ 
  playerScore, 
  aiScore, 
  onRestart, 
  roundNumber = 1, 
  isFinalRound = false,
  overallWinner 
}: ResultsScreenProps) {
  const playerWon = playerScore > aiScore;
  const winner = playerWon ? 'PLAYER' : 'AI TRADER';
  const winnerIcon = playerWon ? '👤' : '🤖';
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center text-white">
      <div className="text-center max-w-2xl mx-auto p-8">
        {/* Winner Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.5 }}
          className="mb-8"
        >
          <div className="text-8xl mb-4">{winnerIcon}</div>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              textShadow: [
                '0 0 10px #fbbf24',
                '0 0 20px #fbbf24, 0 0 30px #fbbf24',
                '0 0 10px #fbbf24'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl font-bold text-yellow-400 mb-2"
          >
            {isFinalRound ? 'BATTLE COMPLETE!' : `ROUND ${roundNumber} - ${winner} WINS!`}
          </motion.div>
        </motion.div>

        {/* Score Display */}
        <div className="bg-black/40 border-4 border-yellow-400 rounded-lg p-8 mb-8">
          <div className="text-3xl font-bold mb-6 text-yellow-400">
            {isFinalRound ? 'FINAL SCORES' : `ROUND ${roundNumber} SCORES`}
          </div>
          
          <div className="grid grid-cols-3 gap-8 items-center">
            {/* Player Score */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={`text-center p-4 rounded-lg ${
                playerWon ? 'bg-green-600/30 border-2 border-green-400' : 'bg-gray-600/30'
              }`}
            >
              <div className="text-4xl mb-2">👤</div>
              <div className="text-lg font-bold">PLAYER</div>
              <div className="text-2xl font-bold text-green-400">
                ${playerScore.toFixed(2)}
              </div>
              <div className="text-sm text-gray-300">
                {playerScore > 10000 ? `+$${(playerScore - 10000).toFixed(2)}` : `-$${(10000 - playerScore).toFixed(2)}`}
              </div>
            </motion.div>

            {/* VS */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, duration: 0.3 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-yellow-400">
                {Math.round((playerScore / aiScore) * 10) / 10} : {Math.round((aiScore / playerScore) * 10) / 10}
              </div>
            </motion.div>

            {/* AI Score */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={`text-center p-4 rounded-lg ${
                !playerWon ? 'bg-red-600/30 border-2 border-red-400' : 'bg-gray-600/30'
              }`}
            >
              <div className="text-4xl mb-2">🤖</div>
              <div className="text-lg font-bold">AI TRADER</div>
              <div className="text-2xl font-bold text-red-400">
                ${aiScore.toFixed(2)}
              </div>
              <div className="text-sm text-gray-300">
                {aiScore > 10000 ? `+$${(aiScore - 10000).toFixed(2)}` : `-$${(10000 - aiScore).toFixed(2)}`}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Performance Analysis */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="bg-black/30 rounded-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-yellow-400 mb-4">BATTLE ANALYSIS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <strong>Player Performance:</strong> {
                playerScore > 11000 ? 'Excellent trading! 🎯' :
                playerScore > 10500 ? 'Good strategy! 📈' :
                playerScore > 10000 ? 'Decent performance! 👍' :
                'Room for improvement! 📚'
              }
            </div>
            <div>
              <strong>AI Advantage:</strong> {
                aiScore > playerScore ? 'AI utilized market patterns effectively 🤖' :
                'Player outmaneuvered the AI algorithm! 🏆'
              }
            </div>
          </div>
        </motion.div>

        {/* Restart Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2, duration: 0.3 }}
        >
            <Button
              onClick={onRestart}
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-8 py-4"
            >
              {isFinalRound ? '🔄 NEW BATTLE' : '⏭️ CONTINUE'}
            </Button>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute top-10 left-10 text-4xl opacity-50"
        >
          💰
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, 10, 0],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute bottom-10 right-10 text-4xl opacity-50"
        >
          📈
        </motion.div>
      </div>
    </div>
  );
}
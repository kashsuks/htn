import { motion } from 'motion/react';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';

interface ResultsScreenProps {
  playerScore: number;
  aiScore: number;
  onRestart: () => void;
}

export function ResultsScreen({ playerScore, aiScore, onRestart }: ResultsScreenProps) {
  const playerWon = playerScore > aiScore;
  const winner = playerWon ? 'PLAYER' : 'RBC InvestEase';
  const winnerIcon = playerWon ? '👤' : '👾';
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center text-white pixel-font">
      <div className="text-center max-w-2xl mx-auto p-8">
        {/* Winner Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.5 }}
          className="mb-12"
        >
          <div className="text-8xl mb-4">{winnerIcon}</div>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl font-bold mb-2"
            style={{ color: '#00ff41' }}
          >
            {winner} WINS!
          </motion.div>
        </motion.div>

        {/* Score Display */}
        <div className="bg-black/60 border-4 rounded-lg p-12 mb-8" style={{ borderColor: '#00ff41'}}>
          <div className="text-3xl font-bold mb-6" style={{ color: '#fff900'}}>FINAL SCORES</div>
          
          <div className="grid grid-cols-3 gap-12 items-center">
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
              <div className="text-6xl font-bold" style={{ color: '#ff0066'}}>
                {Math.round((playerScore / aiScore) * 10) / 10} : {Math.round((aiScore / playerScore) * 10) / 10}
              </div>
            </motion.div>

            {/* AI Score */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={`text-center p-4 rounded-lg ${
                !playerWon ? 'bg-green-600/30 border-2 border-green-400' : 'bg-gray-600/30'
              }`}
            >
              <div className="text-4xl mb-2">👾</div>
              <div className="text-lg font-bold">RBC InvestEase</div>
              <div className="text-2xl font-bold text-red-400">
                ${aiScore.toFixed(2)}
              </div>
              <div className="text-sm text-gray-300">
                {aiScore > 10000 ? `+$${(aiScore - 10000).toFixed(2)}` : `-$${(10000 - aiScore).toFixed(2)}`}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Restart Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 2, duration: 0.3 }}
        >
          <Button
            onClick={onRestart}
            size="lg"
            className="text-black font-bold text-xl px-8 py-4 mt-8"
            style={{ backgroundColor: '#fff900' }}
            onMouseEnter={(e: { target: { style: { backgroundColor: string; }; }; }) => e.target.style.backgroundColor = '#00cc33'}
            onMouseLeave={(e: { target: { style: { backgroundColor: string; }; }; }) => e.target.style.backgroundColor = '#fff900'}
          >
            <RotateCcw/> BATTLE AGAIN
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
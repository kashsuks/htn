import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface VSScreenProps {
  onComplete: () => void;
  playerScore?: number;
  aiScore?: number;
  roundNumber?: number;
}

export function VSScreen({ onComplete, playerScore = 0, aiScore = 0, roundNumber = 1 }: VSScreenProps) {
  const [showVS, setShowVS] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowVS(true), 500);
    const timer2 = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-red-900 to-yellow-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Player 1 */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: -100, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="absolute left-1/4 top-1/2 transform -translate-y-1/2"
        >
          <div className="text-6xl mb-4">👤</div>
          <div className="text-white text-2xl font-bold bg-blue-600 px-4 py-2 rounded">
            PLAYER
          </div>
        </motion.div>

        {/* VS */}
        <motion.div
          initial={{ scale: 0, rotate: 360 }}
          animate={showVS ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 360 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-yellow-400 text-8xl font-bold stroke-black drop-shadow-2xl"
          style={{ textShadow: '4px 4px 0 #000' }}
        >
          VS
        </motion.div>

        {/* Player 2 (AI) */}
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 100, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="absolute right-1/4 top-1/2 transform -translate-y-1/2"
        >
          <div className="text-6xl mb-4">🤖</div>
          <div className="text-white text-2xl font-bold bg-red-600 px-4 py-2 rounded">
            AI TRADER
          </div>
        </motion.div>

        {/* Lightning effects */}
        <motion.div
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/4 left-1/3 text-yellow-300 text-4xl">⚡</div>
          <div className="absolute bottom-1/4 right-1/3 text-yellow-300 text-4xl">⚡</div>
          <div className="absolute top-1/3 right-1/4 text-yellow-300 text-4xl">⚡</div>
        </motion.div>

        {/* Battle text */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-3xl font-bold"
        >
          ROUND {roundNumber} - AI TURN!
        </motion.div>

        {/* Player Score Display */}
        {playerScore > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white text-xl"
          >
            Player Score: ${playerScore.toLocaleString()}
          </motion.div>
        )}
      </div>
    </div>
  );
}
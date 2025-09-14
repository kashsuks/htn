import { motion } from 'motion/react';

interface DateTimerProps {
  timeLeft: number;
  totalTime: number;
}

export function DateTimer({ timeLeft, totalTime }: DateTimerProps) {
  // Convert remaining time to dates (every 2 seconds = 1 day)
  const totalDays = Math.floor(totalTime / 2);
  const daysLeft = Math.floor(timeLeft / 2);
  const currentDay = totalDays - daysLeft;
  
  // Create date progression (starting from Jan 1, 2024)
  const startDate = new Date(2024, 0, 1);
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + currentDay);
  
  const formatDate = (date: Date) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                   'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="pixel-font text-center mb-6">
      <motion.div
        animate={{ 
          textShadow: [
            '0 0 5px #00ff00, 0 0 10px #00ff00',
            '0 0 10px #00ff00, 0 0 20px #00ff00',
            '0 0 5px #00ff00, 0 0 10px #00ff00'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-4xl text-green-400 mb-2"
      >
      </motion.div>
    </div>
  );
}
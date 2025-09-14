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
        className="text-4xl text-[#00e1ff] mb-2"
        style={{}}
        >
        {formatDate(currentDate)}
      </motion.div>
      
      <div className="text-[#fff900] text-lg mb-3">
        DAY {currentDay + 1} OF {totalDays} | {timeLeft}s REMAINING
      </div>
      
      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto h-4 bg-gray-800 border-2 border-green-400 relative overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-600 to-green-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-0 scanlines" />
      </div>
    </div>
  );
}
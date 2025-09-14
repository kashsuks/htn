import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface Event {
  character: string;
  message: string;
  impact: 'positive' | 'negative' | 'neutral';
}

const MARKET_EVENTS: Event[] = [
  {
    character: "📊 ANALYST",
    message: "Q3 earnings looking strong across all sectors!",
    impact: 'positive'
  },
  {
    character: "⚡ TRADER",
    message: "Major sell-off incoming! Brace for impact!",
    impact: 'negative'
  },
  {
    character: "🎯 CEO",
    message: "New product launch exceeds expectations!",
    impact: 'positive'
  },
  {
    character: "📈 ECONOMIST",
    message: "Inflation data creates market uncertainty...",
    impact: 'negative'
  },
  {
    character: "💎 INVESTOR",
    message: "Hidden gem discovered in small-cap sector!",
    impact: 'positive'
  },
  {
    character: "🔥 REPORTER",
    message: "Breaking: Regulatory changes ahead!",
    impact: 'neutral'
  }
];

interface CharacterPopupProps {
  onEventTrigger: (impact: 'positive' | 'negative' | 'neutral') => void;
}

export function CharacterPopup({ onEventTrigger }: CharacterPopupProps) {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [showEvent, setShowEvent] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvent = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
      setCurrentEvent(randomEvent);
      setShowEvent(true);
      onEventTrigger(randomEvent.impact);

      setTimeout(() => {
        setShowEvent(false);
      }, 4000);
    }, 6000);

    return () => clearInterval(interval);
  }, []); // Removed onEventTrigger dependency to prevent recreation

  return (
    <AnimatePresence>
      {showEvent && currentEvent && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="fixed top-1/2 left-8 z-50 transform -translate-y-1/2"
        >
          <div className={`relative p-4 rounded-lg border-4 max-w-xs ${
            currentEvent.impact === 'positive' ? 'bg-green-100 border-green-500 text-green-800' :
            currentEvent.impact === 'negative' ? 'bg-red-100 border-red-500 text-red-800' :
            'bg-blue-100 border-blue-500 text-blue-800'
          }`}>
            <div className="font-bold text-4xl mb-2">{currentEvent.character}</div>
            <div className="text-xl">{currentEvent.message}</div>
            
            {/* Speech bubble arrow */}
            <div className={`absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 w-0 h-0 ${
              currentEvent.impact === 'positive' ? 'border-l-green-500' :
              currentEvent.impact === 'negative' ? 'border-l-red-500' :
              'border-l-blue-500'
            } border-l-[20px] border-t-[10px] border-b-[10px] border-t-transparent border-b-transparent`}></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
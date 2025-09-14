import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsItem {
  id: string;
  symbol: string;
  headline: string;
  timestamp: number;
}

interface NewsPopupProps {
  newsItems: NewsItem[];
}

export function NewsPopup({ newsItems }: NewsPopupProps) {
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Show latest news item
  useEffect(() => {
    if (newsItems.length > 0) {
      const latestNews = newsItems[newsItems.length - 1];
      if (!currentNews || latestNews.id !== currentNews.id) {
        setCurrentNews(latestNews);
        setDisplayedText('');
        setIsTyping(true);
      }
    }
  }, [newsItems, currentNews]);

  // Typewriter effect
  useEffect(() => {
    if (!currentNews || !isTyping) return;

    const fullText = `📰 ${currentNews.symbol}: ${currentNews.headline}`;
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setCurrentNews(null);
          setDisplayedText('');
        }, 5000);
      }
    }, 50); // 50ms per character for typewriter effect

    return () => clearInterval(typeInterval);
  }, [currentNews, isTyping]);

  if (!currentNews) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.8 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <div 
          className="bg-black bg-opacity-90 border-2 neon-border-cyan rounded-lg p-4 max-w-sm shadow-2xl"
          style={{ backgroundColor: 'rgba(0, 25, 50, 0.95)' }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="text-cyan-300 text-sm font-mono leading-relaxed">
                {displayedText}
                {isTyping && (
                  <span className="animate-pulse text-cyan-400">|</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-2 font-mono">
                {new Date(currentNews.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

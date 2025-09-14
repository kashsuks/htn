import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const NEWS_HEADLINES = [
  "🚨 BREAKING: Tech stocks surge on AI breakthrough announcement",
  "📈 MARKET UPDATE: Energy sector sees unexpected rally",
  "💰 ALERT: Major merger talks boost pharmaceutical stocks",
  "⚡ FLASH: Federal Reserve hints at interest rate changes",
  "🔥 HOT: Crypto adoption drives fintech stock prices up",
  "📊 TRENDING: Green energy investments reach all-time high",
  "🎯 TARGET: Retail giants report better than expected earnings",
  "🌟 SPOTLIGHT: Emerging markets show strong growth potential"
];

export function NewsTicker() {
  const [currentNews, setCurrentNews] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNews((prev) => (prev + 1) % NEWS_HEADLINES.length);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-red-600 mt-[4rem] text-white py-2 overflow-hidden">
      <motion.div
        key={currentNews}
        initial={{ x: "100%" }}
        animate={{ x: "-100%" }}
        transition={{ duration: 16, ease: "linear" }}
        className="whitespace-nowrap px-4 text-3xl font-bold"
      >
        {NEWS_HEADLINES[currentNews]}
      </motion.div>
    </div>
  );
}
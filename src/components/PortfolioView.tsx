import { motion } from 'motion/react';
import { DateTimer } from './DateTimer';
import { PortfolioGraph } from './PortfolioGraph';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface PortfolioViewProps {
  portfolio: {[key: string]: number};
  stocks: Stock[];
  cash: number;
  totalValue: number;
  timeLeft: number;
  totalTime: number;
  startValue?: number;
  isAITurn: boolean;
  onTrade: () => void;
}

export function PortfolioView({ 
  portfolio, 
  stocks, 
  cash, 
  totalValue, 
  timeLeft, 
  totalTime,
  startValue = 10000,
  isAITurn, 
  onTrade 
}: PortfolioViewProps) {
  const portfolioEntries = Object.entries(portfolio).filter(([_, shares]) => shares > 0);
  const portfolioValue = totalValue - cash;
  const gainLoss = totalValue - startValue;
  const gainLossPercent = ((totalValue - startValue) / startValue) * 100;

  return (
    <div className="min-h-screen text-white p-6 flex flex-col scanlines pixel-font" style={{backgroundColor: '#061625'}}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl neon-pink mb-4"
        >
          {isAITurn ? '🤖 AI TRADER' : '👤 PLAYER'}
        </motion.div>
        <DateTimer timeLeft={timeLeft} totalTime={totalTime} />
      </div>

      {/* Total Portfolio Value */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col justify-center items-center text-center mb-8"
      >
        <div className="border-4 neon-border-blue p-12 w-full max-w-2xl" style={{backgroundColor: 'rgba(6, 22, 37, 0.8)'}}>
          <div className="mb-6">
            <div className="text-lg neon-blue mb-2">TOTAL PORTFOLIO VALUE</div>
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
                textShadow: [
                  '0 0 20px #00ff00, 0 0 40px #00ff00',
                  '0 0 30px #00ff00, 0 0 60px #00ff00',
                  '0 0 20px #00ff00, 0 0 40px #00ff00'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl neon-yellow mb-4"
            >
              ${totalValue.toFixed(2)}
            </motion.div>
            <div className={`text-3xl ${gainLoss >= 0 ? 'neon-blue' : 'neon-red'}`}>
              {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(1)}%)
            </div>
          </div>

          {/* Portfolio Graph */}
          <PortfolioGraph totalValue={totalValue} startValue={startValue} />

          {/* Cash and Investment Split */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="text-center border-2 neon-border-blue p-4" style={{backgroundColor: 'rgba(0, 225, 255, 0.1)'}}>
              <div className="text-lg neon-blue mb-2">💰 CASH</div>
              <div className="text-3xl neon-blue">${cash.toFixed(2)}</div>
              <div className="text-sm text-white">{((cash / totalValue) * 100).toFixed(1)}%</div>
            </div>
            <div className="text-center border-2 neon-border-pink p-4" style={{backgroundColor: 'rgba(255, 0, 233, 0.1)'}}>
              <div className="text-lg neon-pink mb-2">📈 INVESTMENTS</div>
              <div className="text-3xl neon-pink">${portfolioValue.toFixed(2)}</div>
              <div className="text-sm text-white">{((portfolioValue / totalValue) * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Holdings Summary */}
          {portfolioEntries.length > 0 && (
            <div className="mb-6">
              <div className="text-lg neon-purple mb-4">🏢 HOLDINGS</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolioEntries.map(([symbol, shares]) => {
                  const stock = stocks.find(s => s.symbol === symbol);
                  if (!stock) return null;
                  
                  const value = stock.price * shares;
                  return (
                    <motion.div
                      key={symbol}
                      whileHover={{ scale: 1.02 }}
                      className="border-2 neon-border-purple p-4" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="neon-purple">{symbol}</div>
                          <div className="text-sm text-white">{shares} shares</div>
                        </div>
                        <div className="text-right">
                          <div className="neon-yellow">${value.toFixed(2)}</div>
                          <div className={`text-sm ${stock.change >= 0 ? 'neon-blue' : 'neon-red'}`}>
                            ${stock.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock Market Display - Show for both player and AI */}
          <div className="mb-6">
            <div className="text-lg neon-green mb-4">📈 MARKET PRICES</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stocks.map((stock) => (
                <motion.div
                  key={stock.symbol}
                  whileHover={{ scale: 1.02 }}
                  className="border-2 neon-border-green p-4" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)'}}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="neon-green">{stock.symbol}</div>
                      <div className="text-sm text-white">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="neon-yellow">${stock.price.toFixed(2)}</div>
                      <div className={`text-sm ${stock.change >= 0 ? 'neon-blue' : 'neon-red'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {portfolioEntries.length === 0 && !isAITurn && (
            <div className="text-center text-white mb-6 border-2 neon-border-purple p-6" style={{backgroundColor: 'rgba(97, 0, 255, 0.1)'}}>
              <div className="text-4xl mb-2">📊</div>
              <div className="neon-purple">NO INVESTMENTS YET</div>
              <div className="text-sm text-white">CLICK BUY/SELL TO START TRADING!</div>
            </div>
          )}

          {isAITurn && (
            <div className="text-center text-white mb-6 border-2 neon-border-cyan p-6" style={{backgroundColor: 'rgba(0, 255, 255, 0.1)'}}>
              <div className="text-4xl mb-2">🤖</div>
              <div className="neon-cyan">AI IS ANALYZING MARKET AND EXECUTING TRADES</div>
              <div className="text-sm text-white">WATCH THE AI TRADING FEED BELOW</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Buy/Sell Button */}
      {!isAITurn && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTrade}
            className="text-black pixel-font text-3xl px-16 py-6 border-4 neon-border-yellow hover:opacity-80"
            style={{backgroundColor: '#fff900'}}
            animate={{
              boxShadow: [
                '0 0 20px #00ff00',
                '0 0 40px #00ff00',
                '0 0 20px #00ff00'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💰 BUY/SELL
          </motion.button>
        </motion.div>
      )}

      {isAITurn && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <div className="text-2xl text-cyan-400 neon-text pixel-font">🤖 AI EXECUTING TRADES...</div>
        </motion.div>
      )}
    </div>
  );
}
import { StockMarketData } from './groqStockMarket';

export interface AITradingDecision {
  action: 'buy' | 'sell' | 'hold';
  symbol: string;
  shares: number;
  reasoning: string;
  confidence: number;
}

export class ContrarianAITrader {
  private tradingHistory: AITradingDecision[] = [];
  
  /**
   * Makes deliberately bad trading decisions - buys high, sells low
   */
  async makeDecision(
    stocks: StockMarketData[], 
    portfolio: {[key: string]: number}, 
    cash: number
  ): Promise<AITradingDecision> {
    
    console.log('🤖🔍 Contrarian AI analyzing market:', {
      stockCount: stocks.length,
      cash: cash,
      portfolio: portfolio,
      stockPrices: stocks.map(s => ({ symbol: s.symbol, price: s.price, change: s.changePercent }))
    });
    
    // Find stocks with highest positive change OR highest prices (buy high strategy)
    const risingStocks = stocks
      .filter(stock => stock.changePercent >= 0) // Include 0% change stocks
      .sort((a, b) => {
        // First sort by change percent, then by price (buy the most expensive)
        if (b.changePercent !== a.changePercent) {
          return b.changePercent - a.changePercent;
        }
        return b.price - a.price;
      });
    
    // Find stocks with negative change OR lowest prices that we own (sell low strategy)
    const fallingOwnedStocks = stocks
      .filter(stock => (portfolio[stock.symbol] || 0) > 0)
      .sort((a, b) => {
        // Sort by change percent (most negative first), then by price (lowest first)
        if (a.changePercent !== b.changePercent) {
          return a.changePercent - b.changePercent;
        }
        return a.price - b.price;
      });
    
    console.log('🤖📊 Market analysis:', {
      risingStocks: risingStocks.length,
      fallingOwnedStocks: fallingOwnedStocks.length,
      topRising: risingStocks[0] ? { symbol: risingStocks[0].symbol, change: risingStocks[0].changePercent, price: risingStocks[0].price } : null
    });
    
    // Contrarian logic: 90% chance to make a bad decision (more aggressive)
    const shouldMakeBadDecision = Math.random() < 0.9;
    console.log('🤖🎲 Decision roll:', { shouldMakeBadDecision });
    
    if (shouldMakeBadDecision) {
      // Bad decision 1: Buy stocks that are rising OR most expensive (buy high)
      if (risingStocks.length > 0 && cash >= risingStocks[0].price) {
        const stock = risingStocks[0];
        const maxShares = Math.floor(cash / stock.price);
        const sharesToBuy = Math.min(maxShares, Math.ceil(Math.random() * 5) + 1);
        
        const decision: AITradingDecision = {
          action: 'buy',
          symbol: stock.symbol,
          shares: sharesToBuy,
          reasoning: `🤖💸 BUYING HIGH! ${stock.symbol} is up ${stock.changePercent.toFixed(2)}% - perfect time to buy at peak!`,
          confidence: 0.9
        };
        
        this.tradingHistory.push(decision);
        console.log('🤖💸 Contrarian AI making BAD decision:', decision);
        return decision;
      }
      
      // Bad decision 2: Sell stocks that are falling (sell low)
      if (fallingOwnedStocks.length > 0) {
        const stock = fallingOwnedStocks[0];
        const ownedShares = portfolio[stock.symbol] || 0;
        const sharesToSell = Math.min(ownedShares, Math.ceil(Math.random() * 3) + 1);
        
        const decision: AITradingDecision = {
          action: 'sell',
          symbol: stock.symbol,
          shares: sharesToSell,
          reasoning: `🤖📉 SELLING LOW! ${stock.symbol} is down ${Math.abs(stock.changePercent).toFixed(2)}% - time to panic sell!`,
          confidence: 0.8
        };
        
        this.tradingHistory.push(decision);
        console.log('🤖📉 Contrarian AI making BAD decision:', decision);
        return decision;
      }
    }
    
    // Fallback: If we can't make ideal bad decisions, make any available trade
    if (risingStocks.length > 0 && cash >= risingStocks[0].price) {
      const stock = risingStocks[0];
      const maxShares = Math.floor(cash / stock.price);
      const sharesToBuy = Math.min(maxShares, 1); // Buy at least 1 share
      
      const fallbackDecision: AITradingDecision = {
        action: 'buy',
        symbol: stock.symbol,
        shares: sharesToBuy,
        reasoning: `🤖🎯 FALLBACK BUY! Buying ${stock.symbol} at $${stock.price.toFixed(2)} because I need to trade something!`,
        confidence: 0.6
      };
      
      this.tradingHistory.push(fallbackDecision);
      console.log('🤖🎯 Contrarian AI fallback decision:', fallbackDecision);
      return fallbackDecision;
    }
    
    // Last resort: hold
    const holdDecision: AITradingDecision = {
      action: 'hold',
      symbol: '',
      shares: 0,
      reasoning: '🤖🤔 No stocks available to buy or insufficient cash...',
      confidence: 0.5
    };
    
    console.log('🤖⏸️ Contrarian AI holding:', holdDecision);
    return holdDecision;
  }
  
  /**
   * Get trading history for analysis
   */
  getTradingHistory(): AITradingDecision[] {
    return [...this.tradingHistory];
  }
  
  /**
   * Reset trading history
   */
  reset(): void {
    this.tradingHistory = [];
  }
  
  /**
   * Get performance metrics (should be bad!)
   */
  getPerformanceMetrics(): {
    totalTrades: number;
    buyHighCount: number;
    sellLowCount: number;
    averageConfidence: number;
  } {
    const buyHighCount = this.tradingHistory.filter(t => 
      t.action === 'buy' && t.reasoning.includes('BUYING HIGH')
    ).length;
    
    const sellLowCount = this.tradingHistory.filter(t => 
      t.action === 'sell' && t.reasoning.includes('SELLING LOW')
    ).length;
    
    const averageConfidence = this.tradingHistory.length > 0 
      ? this.tradingHistory.reduce((sum, t) => sum + t.confidence, 0) / this.tradingHistory.length
      : 0;
    
    return {
      totalTrades: this.tradingHistory.length,
      buyHighCount,
      sellLowCount,
      averageConfidence
    };
  }
}

// Export singleton instance
export const contrarianAITrader = new ContrarianAITrader();

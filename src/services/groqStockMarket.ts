// Groq Stock Market Service - Generates realistic stock market data using Groq AI

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || 'gsk_placeholder',
  dangerouslyAllowBrowser: true
});

export interface StockMarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility: number;
  news: string;
}

export interface MarketConditions {
  overallTrend: 'bull' | 'bear' | 'sideways';
  volatility: number;
  majorEvents: string[];
  economicIndicators: {
    inflation: number;
    interestRate: number;
    gdp: number;
  };
}

class GroqStockMarketService {
  private stocks: StockMarketData[] = [];
  private marketConditions: MarketConditions;
  private currentDay: number = 1;
  private totalDays: number = 7;
  private isInitialized: boolean = false;

  // Stock definitions with realistic sectors
  private stockDefinitions = [
    { symbol: 'TECH', name: 'TechGiant Inc', sector: 'Technology', basePrice: 150.25 },
    { symbol: 'OILC', name: 'OilCorp', sector: 'Energy', basePrice: 85.60 },
    { symbol: 'MEDX', name: 'MediXplore', sector: 'Healthcare', basePrice: 210.40 },
    { symbol: 'FINT', name: 'FinTech Plus', sector: 'Finance', basePrice: 175.80 },
    { symbol: 'RETA', name: 'RetailPro', sector: 'Consumer', basePrice: 75.80 },
    { symbol: 'AUTO', name: 'AutoDrive', sector: 'Automotive', basePrice: 95.30 },
    { symbol: 'REAL', name: 'RealEstate Co', sector: 'Real Estate', basePrice: 120.50 },
    { symbol: 'UTIL', name: 'PowerGrid', sector: 'Utilities', basePrice: 65.20 }
  ];

  async initialize(totalDays: number = 7): Promise<void> {
    if (this.isInitialized) return;
    
    this.totalDays = totalDays;
    this.currentDay = 1;
    
    try {
      console.log('🏗️ Initializing Groq Stock Market...');
      
      // Generate initial market conditions
      this.marketConditions = await this.generateMarketConditions();
      
      // Generate initial stock data
      this.stocks = await this.generateInitialStockData();
      
      this.isInitialized = true;
      console.log('✅ Groq Stock Market initialized with', this.stocks.length, 'stocks');
      
    } catch (error) {
      console.error('❌ Failed to initialize Groq Stock Market:', error);
      throw error;
    }
  }

  private async generateMarketConditions(): Promise<MarketConditions> {
    try {
      const prompt = `Generate realistic current market conditions for a stock market simulation. Include:
      - Overall market trend (bull, bear, or sideways)
      - Market volatility level (0-1 scale)
      - 2-3 major market events that could affect stock prices
      - Economic indicators (inflation %, interest rate %, GDP growth %)
      
      Make it realistic and varied. Return as JSON.`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.8,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || '{}';
      const conditions = JSON.parse(content);
      
      return {
        overallTrend: conditions.overallTrend || 'sideways',
        volatility: conditions.volatility || 0.3,
        majorEvents: conditions.majorEvents || ['Market opened', 'Trading session active'],
        economicIndicators: {
          inflation: conditions.economicIndicators?.inflation || 2.5,
          interestRate: conditions.economicIndicators?.interestRate || 4.0,
          gdp: conditions.economicIndicators?.gdp || 2.8
        }
      };
    } catch (error) {
      console.warn('Failed to generate market conditions with Groq, using defaults:', error);
      return {
        overallTrend: 'sideways',
        volatility: 0.3,
        majorEvents: ['Market opened', 'Trading session active'],
        economicIndicators: {
          inflation: 2.5,
          interestRate: 4.0,
          gdp: 2.8
        }
      };
    }
  }

  private async generateInitialStockData(): Promise<StockMarketData[]> {
    const stocks: StockMarketData[] = [];
    
    for (const stockDef of this.stockDefinitions) {
      try {
        const stockData = await this.generateStockData(stockDef, 1);
        stocks.push(stockData);
      } catch (error) {
        console.warn(`Failed to generate data for ${stockDef.symbol}, using fallback:`, error);
        // Fallback data
        stocks.push({
          symbol: stockDef.symbol,
          name: stockDef.name,
          price: stockDef.basePrice,
          change: 0,
          changePercent: 0,
          volume: Math.floor(Math.random() * 1000000) + 100000,
          marketCap: stockDef.basePrice * 1000000,
          sector: stockDef.sector,
          trend: 'neutral',
          volatility: 0.2,
          news: 'Market opened'
        });
      }
    }
    
    return stocks;
  }

  private async generateStockData(stockDef: any, day: number): Promise<StockMarketData> {
    try {
      const prompt = `Generate realistic stock data for ${stockDef.name} (${stockDef.symbol}) on day ${day} of ${this.totalDays}.
      
      Base price: $${stockDef.basePrice}
      Sector: ${stockDef.sector}
      Market trend: ${this.marketConditions.overallTrend}
      Market volatility: ${this.marketConditions.volatility}
      
      Generate:
      - Current price (realistic movement from base price)
      - Price change and percentage
      - Trading volume (realistic for this sector)
      - Market cap (price * shares outstanding)
      - Stock trend (bullish/bearish/neutral)
      - Volatility level (0-1)
      - Relevant news headline affecting this stock
      
      Make it realistic and consider the sector, market conditions, and day progression.
      Return as JSON.`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content || '{}';
      const data = JSON.parse(content);
      
      return {
        symbol: stockDef.symbol,
        name: stockDef.name,
        price: data.price || stockDef.basePrice,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        volume: data.volume || Math.floor(Math.random() * 1000000) + 100000,
        marketCap: data.marketCap || (data.price || stockDef.basePrice) * 1000000,
        sector: stockDef.sector,
        trend: data.trend || 'neutral',
        volatility: data.volatility || 0.2,
        news: data.news || 'Market activity'
      };
    } catch (error) {
      console.warn(`Failed to generate Groq data for ${stockDef.symbol}:`, error);
      throw error;
    }
  }

  async updateMarket(day: number): Promise<StockMarketData[]> {
    if (!this.isInitialized) {
      throw new Error('Stock market not initialized. Call initialize() first.');
    }

    this.currentDay = day;
    console.log(`📈 Updating market for day ${day}/${this.totalDays}`);

    const updatedStocks: StockMarketData[] = [];

    for (const stock of this.stocks) {
      try {
        const updatedStock = await this.generateStockData(
          { symbol: stock.symbol, name: stock.name, sector: stock.sector, basePrice: stock.price },
          day
        );
        updatedStocks.push(updatedStock);
      } catch (error) {
        console.warn(`Failed to update ${stock.symbol}, keeping previous data:`, error);
        updatedStocks.push(stock);
      }
    }

    this.stocks = updatedStocks;
    return updatedStocks;
  }

  getCurrentStocks(): StockMarketData[] {
    return this.stocks;
  }

  getMarketConditions(): MarketConditions {
    return this.marketConditions;
  }

  getCurrentDay(): number {
    return this.currentDay;
  }

  getTotalDays(): number {
    return this.totalDays;
  }

  // Generate autonomous AI trading decision
  async generateAIDecision(stocks: StockMarketData[], portfolio: {[key: string]: number}, cash: number): Promise<{
    action: 'buy' | 'sell' | 'hold';
    symbol: string;
    shares: number;
    reasoning: string;
  }> {
    try {
      const portfolioSummary = Object.entries(portfolio).map(([symbol, shares]) => {
        const stock = stocks.find(s => s.symbol === symbol);
        return `${symbol}: ${shares} shares @ $${stock?.price || 0}`;
      }).join(', ');

      const prompt = `You are an autonomous AI investor. Analyze the current market and make a trading decision.

      Available cash: $${cash.toFixed(2)}
      Current portfolio: ${portfolioSummary || 'Empty'}
      
      Current market conditions:
      - Trend: ${this.marketConditions.overallTrend}
      - Volatility: ${this.marketConditions.volatility}
      
      Available stocks:
      ${stocks.map(s => `${s.symbol}: $${s.price.toFixed(2)} (${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%) - ${s.trend}`).join('\n')}
      
      Strategy: Buy when prices are low/red (bearish), sell when prices are high/green (bullish).
      Consider portfolio diversification and risk management.
      
      Make ONE trading decision. Return as JSON with:
      - action: "buy", "sell", or "hold"
      - symbol: stock symbol
      - shares: number of shares (1-5)
      - reasoning: brief explanation`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.6,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content || '{}';
      const decision = JSON.parse(content);
      
      return {
        action: decision.action || 'hold',
        symbol: decision.symbol || stocks[0]?.symbol || 'TECH',
        shares: Math.max(1, Math.min(5, decision.shares || 1)),
        reasoning: decision.reasoning || 'Market analysis'
      };
    } catch (error) {
      console.warn('Failed to generate AI decision with Groq, using fallback:', error);
      // Fallback: simple buy/sell logic
      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
      const shouldBuy = randomStock.changePercent < -1; // Buy if down more than 1%
      const shouldSell = randomStock.changePercent > 2; // Sell if up more than 2%
      
      if (shouldBuy && cash >= randomStock.price) {
        return {
          action: 'buy',
          symbol: randomStock.symbol,
          shares: 1,
          reasoning: 'Price dropped, buying opportunity'
        };
      } else if (shouldSell && portfolio[randomStock.symbol] > 0) {
        return {
          action: 'sell',
          symbol: randomStock.symbol,
          shares: 1,
          reasoning: 'Price increased, taking profits'
        };
      } else {
        return {
          action: 'hold',
          symbol: randomStock.symbol,
          shares: 0,
          reasoning: 'No clear opportunity'
        };
      }
    }
  }

  // Generate InvestEase simulator performance
  async generateInvestEasePerformance(initialValue: number, days: number): Promise<{
    finalValue: number;
    totalReturn: number;
    dailyReturns: number[];
    strategy: string;
  }> {
    try {
      const prompt = `Simulate InvestEase AI portfolio performance over ${days} days.
      
      Initial value: $${initialValue}
      Market trend: ${this.marketConditions.overallTrend}
      Market volatility: ${this.marketConditions.volatility}
      
      Generate realistic performance data for a professional AI investment service:
      - Final portfolio value
      - Total return percentage
      - Daily returns array (${days} values)
      - Investment strategy description
      
      Make it realistic for a professional AI service. Return as JSON.`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        max_tokens: 400
      });

      const content = response.choices[0]?.message?.content || '{}';
      const data = JSON.parse(content);
      
      return {
        finalValue: data.finalValue || initialValue * 1.05,
        totalReturn: data.totalReturn || 5.0,
        dailyReturns: data.dailyReturns || Array(days).fill(0.1),
        strategy: data.strategy || 'AI-driven portfolio optimization'
      };
    } catch (error) {
      console.warn('Failed to generate InvestEase performance with Groq, using fallback:', error);
      // Fallback: conservative growth
      const dailyReturn = 0.1; // 0.1% daily return
      const finalValue = initialValue * Math.pow(1 + dailyReturn/100, days);
      
      return {
        finalValue: finalValue,
        totalReturn: ((finalValue - initialValue) / initialValue) * 100,
        dailyReturns: Array(days).fill(dailyReturn),
        strategy: 'Conservative AI portfolio management'
      };
    }
  }
}

export const groqStockMarket = new GroqStockMarketService();

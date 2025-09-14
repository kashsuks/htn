// Groq Stock Market Service - Generates realistic stock market data using Groq AI

// Groq API calls now handled through backend service

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
  private marketConditions: MarketConditions = {
    overallTrend: 'sideways',
    volatility: 0.3,
    majorEvents: [],
    economicIndicators: { inflation: 2.5, interestRate: 4.0, gdp: 2.8 }
  };
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
      // Use backend Groq service instead of direct API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/groq/market-conditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Generate realistic current market conditions for a stock market simulation'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          overallTrend: data.overallTrend || 'sideways',
          volatility: data.volatility || 0.3,
          majorEvents: data.majorEvents || ['Market opened', 'Trading session active'],
          economicIndicators: {
            inflation: data.economicIndicators?.inflation || 2.5,
            interestRate: data.economicIndicators?.interestRate || 4.0,
            gdp: data.economicIndicators?.gdp || 2.8
          }
        };
      } else {
        throw new Error('Backend Groq service unavailable');
      }
    } catch (error) {
      console.warn('Failed to generate market conditions with backend Groq, using defaults:', error);
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
      // Use backend Groq service instead of direct API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/groq/stock-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stockDef,
          day,
          totalDays: this.totalDays,
          marketConditions: this.marketConditions
        })
      });

      if (response.ok) {
        const data = await response.json();
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
      } else {
        throw new Error('Backend Groq service unavailable');
      }
    } catch (error) {
      console.warn(`Failed to generate Groq data for ${stockDef.symbol}:`, error);
      // Fallback to simple price generation
      const priceChange = (Math.random() - 0.5) * 0.1; // ±5% change
      const newPrice = stockDef.basePrice * (1 + priceChange);
      const change = newPrice - stockDef.basePrice;
      const changePercent = (change / stockDef.basePrice) * 100;
      
      return {
        symbol: stockDef.symbol,
        name: stockDef.name,
        price: newPrice,
        change: change,
        changePercent: changePercent,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        marketCap: newPrice * 1000000,
        sector: stockDef.sector,
        trend: changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral',
        volatility: 0.2,
        news: `${stockDef.name} ${changePercent > 0 ? 'gains' : 'drops'} ${Math.abs(changePercent).toFixed(1)}%`
      };
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
  async generateAIDecision(stocks: StockMarketData[], portfolio: Record<string, number>, cash: number): Promise<any> {
    try {
      // Use backend Groq service instead of direct API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/groq/ai-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stocks,
          portfolio,
          cash,
          marketConditions: this.marketConditions
        })
      });

      if (response.ok) {
        const decision = await response.json();
        console.log('🤖 AI Decision:', decision);
        return decision;
      } else {
        throw new Error('Backend Groq service unavailable');
      }
    } catch (error) {
      console.warn('Failed to generate AI decision:', error);
      // Fallback to simple random decision
      const action = Math.random() < 0.7 ? 'hold' : (Math.random() < 0.5 ? 'buy' : 'sell');
      if (action === 'hold') {
        return { action: 'hold', reasoning: 'Market analysis inconclusive' };
      }
      
      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
      const shares = Math.floor(Math.random() * 5) + 1;
      
      return {
        action,
        symbol: randomStock.symbol,
        shares,
        reasoning: `Random ${action} decision due to analysis error`
      };
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
      // Use backend Groq service instead of direct API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/groq/investease-performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          initialValue,
          days,
          marketConditions: this.marketConditions
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          finalValue: data.finalValue || initialValue * 1.05,
          totalReturn: data.totalReturn || 5.0,
          dailyReturns: data.dailyReturns || Array(days).fill(0.1),
          strategy: data.strategy || 'AI-driven portfolio optimization'
        };
      } else {
        throw new Error('Backend Groq service unavailable');
      }
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

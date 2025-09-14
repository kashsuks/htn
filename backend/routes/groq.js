const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// POST /groq/market-conditions - Generate market conditions
router.post('/market-conditions', async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: 'Groq API not configured',
        message: 'GROQ_API_KEY environment variable not set',
        fallback: {
          overallTrend: 'sideways',
          volatility: 0.3,
          majorEvents: ['Market opened', 'Trading session active'],
          economicIndicators: {
            inflation: 2.5,
            interestRate: 4.0,
            gdp: 2.8
          }
        }
      });
    }

    const prompt = `Generate realistic current market conditions for a stock market simulation. Include:
    - Overall market trend (bull, bear, or sideways)
    - Market volatility level (0-1 scale)
    - 2-3 major market events that could affect stock prices
    - Economic indicators (inflation %, interest rate %, GDP growth %)
    
    Make it realistic and varied. Return as JSON only.`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '{}';
    const conditions = JSON.parse(content);
    
    res.json({
      overallTrend: conditions.overallTrend || 'sideways',
      volatility: conditions.volatility || 0.3,
      majorEvents: conditions.majorEvents || ['Market opened', 'Trading session active'],
      economicIndicators: {
        inflation: conditions.economicIndicators?.inflation || 2.5,
        interestRate: conditions.economicIndicators?.interestRate || 4.0,
        gdp: conditions.economicIndicators?.gdp || 2.8
      }
    });

  } catch (error) {
    console.error('Error generating market conditions:', error);
    res.status(500).json({
      error: 'Failed to generate market conditions',
      message: error.message,
      fallback: {
        overallTrend: 'sideways',
        volatility: 0.3,
        majorEvents: ['Market opened', 'Trading session active'],
        economicIndicators: {
          inflation: 2.5,
          interestRate: 4.0,
          gdp: 2.8
        }
      }
    });
  }
});

// POST /groq/stock-data - Generate stock data
router.post('/stock-data', async (req, res) => {
  try {
    const { stockDef, day, totalDays, marketConditions } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: 'Groq API not configured',
        fallback: {
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
          news: 'Market activity'
        }
      });
    }

    const prompt = `Generate realistic stock data for ${stockDef.name} (${stockDef.symbol}) on day ${day} of ${totalDays}.
    
    Base price: $${stockDef.basePrice}
    Sector: ${stockDef.sector}
    Market trend: ${marketConditions.overallTrend}
    Market volatility: ${marketConditions.volatility}
    
    Generate:
    - Current price (realistic movement from base price)
    - Price change and percentage
    - Trading volume (realistic for this sector)
    - Market cap (price * shares outstanding)
    - Stock trend (bullish/bearish/neutral)
    - Volatility level (0-1)
    - Relevant news headline affecting this stock
    
    Make it realistic and consider the sector, market conditions, and day progression.
    Return as JSON only.`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content || '{}';
    const data = JSON.parse(content);
    
    res.json({
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
    });

  } catch (error) {
    console.error('Error generating stock data:', error);
    res.status(500).json({
      error: 'Failed to generate stock data',
      fallback: {
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
        news: 'Market activity'
      }
    });
  }
});

// POST /groq/ai-decision - Generate AI trading decision
router.post('/ai-decision', async (req, res) => {
  try {
    const { stocks, portfolio, cash, marketConditions } = req.body;

    if (!process.env.GROQ_API_KEY) {
      // Fallback: simple buy/sell logic
      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
      const shouldBuy = randomStock.changePercent < -1; // Buy if down more than 1%
      const shouldSell = randomStock.changePercent > 2; // Sell if up more than 2%
      
      if (shouldBuy && cash >= randomStock.price) {
        return res.json({
          action: 'buy',
          symbol: randomStock.symbol,
          shares: 1,
          reasoning: 'Price dropped, buying opportunity'
        });
      } else if (shouldSell && portfolio[randomStock.symbol] > 0) {
        return res.json({
          action: 'sell',
          symbol: randomStock.symbol,
          shares: 1,
          reasoning: 'Price increased, taking profits'
        });
      } else {
        return res.json({
          action: 'hold',
          symbol: randomStock.symbol,
          shares: 0,
          reasoning: 'No clear opportunity'
        });
      }
    }

    const portfolioSummary = Object.entries(portfolio).map(([symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return `${symbol}: ${shares} shares @ $${stock?.price || 0}`;
    }).join(', ');

    const prompt = `You are an autonomous AI investor. Analyze the current market and make a trading decision.

    Available cash: $${cash.toFixed(2)}
    Current portfolio: ${portfolioSummary || 'Empty'}
    
    Current market conditions:
    - Trend: ${marketConditions.overallTrend}
    - Volatility: ${marketConditions.volatility}
    
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
    
    res.json({
      action: decision.action || 'hold',
      symbol: decision.symbol || stocks[0]?.symbol || 'TECH',
      shares: Math.max(1, Math.min(5, decision.shares || 1)),
      reasoning: decision.reasoning || 'Market analysis'
    });

  } catch (error) {
    console.error('Error generating AI decision:', error);
    // Fallback logic
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    res.json({
      action: 'hold',
      symbol: randomStock.symbol,
      shares: 0,
      reasoning: 'Error in analysis, holding position'
    });
  }
});

// Generate InvestEase performance simulation
router.post('/investease-performance', async (req, res) => {
  try {
    const { initialValue, days, marketConditions } = req.body;

    const prompt = `Simulate InvestEase AI portfolio performance over ${days} days.
    
    Initial value: $${initialValue}
    Market trend: ${marketConditions.overallTrend}
    Market volatility: ${marketConditions.volatility}
    
    Generate realistic performance data for a professional AI investment service:
    - Final portfolio value
    - Total return percentage
    - Daily returns array (${days} values)
    - Investment strategy description
    
    Make it realistic for a professional AI service. Return as JSON.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 400
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const data = JSON.parse(content);
    
    res.json({
      finalValue: data.finalValue || initialValue * 1.05,
      totalReturn: data.totalReturn || 5.0,
      dailyReturns: data.dailyReturns || Array(days).fill(0.1),
      strategy: data.strategy || 'AI-driven portfolio optimization'
    });
  } catch (error) {
    console.error('Error generating InvestEase performance:', error);
    // Return fallback data
    const dailyReturn = 0.1; // 0.1% daily return
    const finalValue = req.body.initialValue * Math.pow(1 + dailyReturn/100, req.body.days);
    
    res.json({
      finalValue: finalValue,
      totalReturn: ((finalValue - req.body.initialValue) / req.body.initialValue) * 100,
      dailyReturns: Array(req.body.days).fill(dailyReturn),
      strategy: 'Conservative AI portfolio management'
    });
  }
});

module.exports = router;

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

class GroqStockService {
  constructor() {
    this.stockTimeSeries = new Map();
  }

  async generateStockData(stocks, durationMinutes = 1) {
    try {
      const startTime = Date.now();
      const totalDataPoints = Math.floor((durationMinutes * 60) / 2); // One point every 2 seconds
      
      const prompt = `Generate realistic stock price movements for a ${durationMinutes}-minute trading simulation.

Stocks to generate data for:
${stocks.map(s => `- ${s.symbol} (${s.name}): Starting at $${s.initialPrice.toFixed(2)}`).join('\n')}

Requirements:
- Generate exactly ${totalDataPoints} data points per stock (one every 2 seconds)
- Prices should fluctuate realistically (±0.1% to ±2% per change)
- Include realistic market volatility and trends
- Timestamps should be 2000ms apart starting from ${startTime}
- Ensure prices stay within reasonable bounds (no negative prices)
- Return ONLY valid JSON in this exact format:

{
  "stocks": {
    "${stocks[0]?.symbol || 'AAPL'}": {
      "name": "${stocks[0]?.name || 'Apple Inc.'}",
      "dataPoints": [
        {"timestamp": ${startTime}, "price": ${stocks[0]?.initialPrice || 150}},
        {"timestamp": ${startTime + 2000}, "price": ${(stocks[0]?.initialPrice || 150) * 1.002}},
        {"timestamp": ${startTime + 4000}, "price": ${(stocks[0]?.initialPrice || 150) * 0.998}}
      ]
    }
  }
}

Generate realistic intraday price movements. Return only the JSON, no explanations.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Groq');
      }

      // Parse the JSON response
      const stockData = JSON.parse(response);
      
      // Convert to our internal format
      const timeSeries = new Map();
      
      for (const [symbol, data] of Object.entries(stockData.stocks)) {
        const dataPoints = data.dataPoints.map((point, index) => {
          const prevPrice = index > 0 ? data.dataPoints[index - 1].price : point.price;
          const change = point.price - prevPrice;
          const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
          
          return {
            timestamp: point.timestamp,
            price: point.price,
            change,
            changePercent
          };
        });

        timeSeries.set(symbol, {
          symbol,
          name: data.name,
          dataPoints,
          currentIndex: 0
        });
      }

      this.stockTimeSeries = timeSeries;
      console.log('📊 Generated stock data for', timeSeries.size, 'stocks with', timeSeries.values().next().value?.dataPoints.length, 'data points each');
      
      return timeSeries;

    } catch (error) {
      console.error('Error generating stock data with Groq:', error);
      
      // Fallback to generated data if Groq fails
      return this.generateFallbackData(stocks, durationMinutes);
    }
  }

  generateFallbackData(stocks, durationMinutes) {
    console.log('🔄 Using fallback stock data generation');
    
    const timeSeries = new Map();
    const dataPointCount = (durationMinutes * 60) / 2; // One point every 2 seconds
    
    for (const stock of stocks) {
      const dataPoints = [];
      let currentPrice = stock.initialPrice;
      const baseTime = Date.now();
      
      for (let i = 0; i < dataPointCount; i++) {
        const timestamp = baseTime + (i * 2000); // 2 seconds apart
        
        // Generate realistic price movement
        const volatility = 0.02; // 2% max change
        const changePercent = (Math.random() - 0.5) * volatility * 100;
        const change = (changePercent / 100) * currentPrice;
        currentPrice = Math.max(1, currentPrice + change);
        
        dataPoints.push({
          timestamp,
          price: currentPrice,
          change,
          changePercent
        });
      }
      
      timeSeries.set(stock.symbol, {
        symbol: stock.symbol,
        name: stock.name,
        dataPoints,
        currentIndex: 0
      });
    }
    
    this.stockTimeSeries = timeSeries;
    return timeSeries;
  }

  getNextDataPoint(symbol) {
    const series = this.stockTimeSeries.get(symbol);
    if (!series || series.currentIndex >= series.dataPoints.length) {
      return null;
    }
    
    const dataPoint = series.dataPoints[series.currentIndex];
    series.currentIndex++;
    
    return dataPoint;
  }

  getCurrentDataPoint(symbol) {
    const series = this.stockTimeSeries.get(symbol);
    if (!series || series.currentIndex === 0) {
      return null;
    }
    
    return series.dataPoints[series.currentIndex - 1];
  }

  hasMoreData(symbol) {
    const series = this.stockTimeSeries.get(symbol);
    return series ? series.currentIndex < series.dataPoints.length : false;
  }

  resetSeries() {
    for (const series of this.stockTimeSeries.values()) {
      series.currentIndex = 0;
    }
  }

  getStockSeries(symbol) {
    return this.stockTimeSeries.get(symbol);
  }

  getAllCurrentPrices() {
    const prices = {};
    for (const [symbol, series] of this.stockTimeSeries.entries()) {
      const currentPoint = this.getCurrentDataPoint(symbol);
      if (currentPoint) {
        prices[symbol] = {
          price: currentPoint.price,
          change: currentPoint.change,
          changePercent: currentPoint.changePercent,
          timestamp: currentPoint.timestamp
        };
      }
    }
    return prices;
  }
}

module.exports = new GroqStockService();

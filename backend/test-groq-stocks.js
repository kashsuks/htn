const Groq = require('groq-sdk');

// Check if API key is available
if (!process.env.GROQ_API_KEY) {
  console.log('❌ GROQ_API_KEY environment variable not set');
  console.log('📝 To test with real Groq API, set your API key:');
  console.log('   export GROQ_API_KEY="your-api-key-here"');
  console.log('🔄 Running with mock data instead...\n');
  
  // Generate mock data to show the format
  generateMockStockData();
  process.exit(0);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function testGroqStockData() {
  try {
    const stocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', initialPrice: 150 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', initialPrice: 2750 },
      { symbol: 'TSLA', name: 'Tesla Inc.', initialPrice: 800 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', initialPrice: 300 }
    ];

    const durationMinutes = 1;
    const startTime = Date.now();
    const totalDataPoints = Math.floor((durationMinutes * 60) / 2); // One point every 2 seconds
    
    console.log('🤖 Testing Groq API for Stock Data Generation');
    console.log('📊 Stocks:', stocks.map(s => `${s.symbol} ($${s.initialPrice})`).join(', '));
    console.log('⏱️  Duration:', durationMinutes, 'minute(s)');
    console.log('📈 Data Points:', totalDataPoints, '(one every 2 seconds)');
    console.log('🕐 Start Time:', new Date(startTime).toISOString());
    console.log('---');

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
    "${stocks[0].symbol}": {
      "name": "${stocks[0].name}",
      "dataPoints": [
        {"timestamp": ${startTime}, "price": ${stocks[0].initialPrice}},
        {"timestamp": ${startTime + 2000}, "price": ${stocks[0].initialPrice * 1.002}},
        {"timestamp": ${startTime + 4000}, "price": ${stocks[0].initialPrice * 0.998}}
      ]
    }
  }
}

Generate realistic intraday price movements. Return only the JSON, no explanations.`;

    console.log('📤 Sending request to Groq API...');
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

    console.log('📥 Raw Groq Response:');
    console.log(response);
    console.log('---');

    // Parse the JSON response
    const stockData = JSON.parse(response);
    
    console.log('📊 Parsed Stock Data:');
    for (const [symbol, data] of Object.entries(stockData.stocks)) {
      console.log(`\n🏢 ${symbol} (${data.name}):`);
      console.log(`📈 Data Points: ${data.dataPoints.length}`);
      
      data.dataPoints.forEach((point, index) => {
        const date = new Date(point.timestamp);
        const timeStr = date.toISOString().substr(11, 8); // HH:MM:SS format
        const prevPrice = index > 0 ? data.dataPoints[index - 1].price : point.price;
        const change = point.price - prevPrice;
        const changePercent = prevPrice !== 0 ? ((change / prevPrice) * 100) : 0;
        
        console.log(`  ${index + 1}. ${timeStr} | $${point.price.toFixed(2)} | ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(3)}%)`);
      });
    }

    console.log('\n✅ Groq API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Groq API:', error);
    
    if (error.message.includes('JSON')) {
      console.log('📝 This might be a JSON parsing error. The Groq response might not be valid JSON.');
    }
  }
}

function generateMockStockData() {
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', initialPrice: 150 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', initialPrice: 2750 },
    { symbol: 'TSLA', name: 'Tesla Inc.', initialPrice: 800 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', initialPrice: 300 }
  ];

  const durationMinutes = 1;
  const startTime = Date.now();
  const totalDataPoints = Math.floor((durationMinutes * 60) / 2); // One point every 2 seconds
  
  console.log('🤖 Mock Stock Data Generation (showing expected Groq format)');
  console.log('📊 Stocks:', stocks.map(s => `${s.symbol} ($${s.initialPrice})`).join(', '));
  console.log('⏱️  Duration:', durationMinutes, 'minute(s)');
  console.log('📈 Data Points:', totalDataPoints, '(one every 2 seconds)');
  console.log('🕐 Start Time:', new Date(startTime).toISOString());
  console.log('---');

  console.log('📊 Generated Stock Data:');
  
  stocks.forEach(stock => {
    console.log(`\n🏢 ${stock.symbol} (${stock.name}):`);
    console.log(`📈 Data Points: ${totalDataPoints}`);
    
    let currentPrice = stock.initialPrice;
    
    for (let i = 0; i < totalDataPoints; i++) {
      const timestamp = startTime + (i * 2000);
      const date = new Date(timestamp);
      const timeStr = date.toISOString().substr(11, 8); // HH:MM:SS format
      
      // Generate realistic price movement (±0.1% to ±2%)
      const volatility = 0.02; // 2% max change
      const changePercent = (Math.random() - 0.5) * volatility * 100;
      const change = (changePercent / 100) * currentPrice;
      const prevPrice = currentPrice;
      currentPrice = Math.max(1, currentPrice + change);
      
      const actualChange = currentPrice - prevPrice;
      const actualChangePercent = prevPrice !== 0 ? ((actualChange / prevPrice) * 100) : 0;
      
      console.log(`  ${i + 1}. ${timeStr} | $${currentPrice.toFixed(2)} | ${actualChange >= 0 ? '+' : ''}${actualChange.toFixed(2)} (${actualChangePercent >= 0 ? '+' : ''}${actualChangePercent.toFixed(3)}%)`);
    }
  });

  console.log('\n✅ Mock data generation completed!');
  console.log('💡 This shows the format that Groq API would return with real data.');
}

// Run the test
testGroqStockData();

// Stock Client Service - Manages RBC clients and portfolios for each stock

// Stock definitions
export const STOCK_DEFINITIONS = [
  { symbol: 'TECH', name: 'TechGiant Inc', price: 150.25, change: 2.5 },
  { symbol: 'OILC', name: 'OilCorp', price: 85.60, change: -1.2 },
  { symbol: 'MEDX', name: 'MediXplore', price: 210.40, change: 3.4 },
  { symbol: 'FINT', name: 'FinTech Plus', price: 175.80, change: -0.8 },
  { symbol: 'RETA', name: 'RetailPro', price: 75.80, change: 0 }
];

export interface StockClient {
  stock: typeof STOCK_DEFINITIONS[0];
  clientId: string;
  portfolioId: string;
}

export interface StockPrediction {
  symbol: string;
  prediction: number;
  confidence: number;
  timeFrame: number;
}

class StockClientService {
  private stockClients: StockClient[] = [];
  private isInitialized = false;
  private teamId: string | null = null;

  async initialize(teamId: string) {
    if (this.isInitialized && this.teamId === teamId) return this.stockClients;
    
    this.teamId = teamId;
    this.stockClients = [];
    
    try {
      console.log('🏗️ Initializing stock clients for team:', teamId);
      
      // First get the JWT token for this team
      const gameApiModule = await import('./gameApi');
      const teamAuth = await gameApiModule.gameApi.registerTeam({ 
        team_name: teamId, 
        contact_email: `${teamId}@stockfighter.game` 
      });
      
      // Create clients and portfolios for each stock
      for (const stock of STOCK_DEFINITIONS) {
        console.log(`📈 Creating client for ${stock.symbol}...`);
        
        const client = await this.createClientForStock(stock, teamAuth.jwtToken);
        console.log(`🔍 Client response for ${stock.symbol}:`, client);
        
        // Extract client ID - it might be client.clientId or client.client_id
        const clientId = client.clientId || client.client_id || client.id;
        if (!clientId) {
          throw new Error(`No client ID found in response for ${stock.symbol}: ${JSON.stringify(client)}`);
        }
        
        const portfolio = await this.createPortfolioForClient(clientId, stock, teamAuth.jwtToken);
        console.log(`🔍 Portfolio response for ${stock.symbol}:`, portfolio);
        
        // Extract portfolio ID
        const portfolioId = portfolio.portfolioId || portfolio.portfolio_id || portfolio.id;
        if (!portfolioId) {
          throw new Error(`No portfolio ID found in response for ${stock.symbol}: ${JSON.stringify(portfolio)}`);
        }
        
        this.stockClients.push({
          stock,
          clientId: clientId,
          portfolioId: portfolioId
        });
        
        console.log(`✅ Created client ${clientId} with portfolio ${portfolioId} for ${stock.symbol}`);
      }
      
      this.isInitialized = true;
      console.log('🎯 Stock clients initialized:', this.stockClients.length);
      return this.stockClients;
    } catch (error) {
      console.error('❌ Failed to initialize stock clients:', error);
      throw error;
    }
  }

  private async createClientForStock(stock: typeof STOCK_DEFINITIONS[0], token: string) {
    const clientData = {
      name: `${stock.name} Trading Client`,
      email: `${stock.symbol.toLowerCase()}.client@stockfighter.game`,
      cash: 500000 // Starting cash for client
    };
    
    const response = await fetch(`https://2dcq63co40.execute-api.us-east-1.amazonaws.com/dev/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Client creation failed for ${stock.symbol}:`, errorText);
      throw new Error(`Failed to create client for ${stock.symbol}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Created client for ${stock.symbol}:`, result);
    return result;
  }

  private async createPortfolioForClient(clientId: string, stock: typeof STOCK_DEFINITIONS[0], token: string) {
    const portfolioData = {
      type: 'balanced', // Default to balanced strategy
      initialAmount: 100000 // Starting amount for each portfolio
    };
    
    const response = await fetch(`https://2dcq63co40.execute-api.us-east-1.amazonaws.com/dev/clients/${clientId}/portfolios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(portfolioData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create portfolio for ${stock.symbol}: ${response.statusText}`);
    }

    return await response.json();
  }

  getStockClients() {
    if (!this.isInitialized) {
      throw new Error('Stock clients not initialized. Call initialize() first.');
    }
    return this.stockClients;
  }

  getClientForStock(symbol: string) {
    return this.stockClients.find(sc => sc.stock.symbol === symbol);
  }

  // Get predictions for all stocks with specified time frame
  async getAllPredictions(timeFrame: number): Promise<StockPrediction[]> {
    if (!this.isInitialized) {
      throw new Error('Stock clients not initialized. Call initialize() first.');
    }

    const predictions = await Promise.all(
      this.stockClients.map(async (stockClient) => {
        try {
          const prediction = await this.getPredictionForStock(stockClient.clientId, stockClient.portfolioId, stockClient.stock.symbol, timeFrame, '');
          return {
            symbol: stockClient.stock.symbol,
            prediction: prediction.prediction || 0,
            confidence: prediction.confidence || 0.5,
            timeFrame: timeFrame
          };
        } catch (error) {
          console.error(`Failed to get prediction for ${stockClient.stock.symbol}:`, error);
          return {
            symbol: stockClient.stock.symbol,
            prediction: 0,
            confidence: 0,
            timeFrame: timeFrame
          };
        }
      })
    );

    return predictions;
  }

  // Get prediction for a specific stock with proper time frame
  private async getPredictionForStock(clientId: string, portfolioId: string, symbol: string, timeFrame: number, token: string): Promise<{ symbol: string; prediction: number; confidence: number }> {
    console.log(`🔮 Getting ${timeFrame}-day prediction for ${symbol}`);
    
    // Use backend proxy to avoid CORS issues
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/rbc/clients/${clientId}/portfolios/${portfolioId}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        time_frame: timeFrame,
        prediction_days: timeFrame,
        symbol: symbol
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get prediction for ${symbol}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      symbol,
      prediction: data.prediction || 0,
      confidence: data.confidence || 0.5
    };
  }

  // Reset service for new team
  reset() {
    this.isInitialized = false;
    this.stockClients = [];
    this.teamId = null;
  }
}

export const stockClientService = new StockClientService();

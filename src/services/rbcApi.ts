// RBC API Service - Direct calls to RBC InvestEase API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Client {
  id: string;
  name: string;
  email: string;
  team_name: string;
  portfolios: Portfolio[];
  created_at: string;
  updated_at: string;
  cash: number;
}

export interface Portfolio {
  id: string;
  client_id: string;
  team_name: string;
  type: 'aggressive_growth' | 'growth' | 'balanced' | 'conservative' | 'very_conservative';
  cash: number;
  current_value: number;
  total_months_simulated: number;
  created_at: string;
  transactions: Transaction[];
  growth_trend: GrowthDataPoint[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  balance_after: number;
}

export interface GrowthDataPoint {
  date: string;
  value: number;
}

export interface SimulationResult {
  portfolioId: string;
  strategy: string;
  monthsSimulated: number;
  daysSimulated: number;
  initialValue: number;
  projectedValue: number;
  totalGrowthPoints: number;
  simulationId: string;
  growth_trend: GrowthDataPoint[];
}

class RBCApiService {
  private token: string | null = null;
  private teamId: string | null = null;

  // Initialize with token
  initialize(token: string, teamId: string) {
    this.token = token;
    this.teamId = teamId;
  }

  // Get authorization headers
  private getAuthHeaders(): HeadersInit {
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Create a new client
  async createClient(clientData: { name: string; email: string; cash: number }): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/clients`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create client');
    }

    const data = await response.json();
    return data.client || data;
  }

  // Get specific client
  async getClient(clientId: string): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/clients/${clientId}?token=${this.token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get client');
    }

    return await response.json();
  }

  // Create a portfolio for a client
  async createPortfolio(clientId: string, portfolioData: { type: string; initialAmount: number }): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/clients/${clientId}/portfolios`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(portfolioData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portfolio');
    }

    const data = await response.json();
    return data.portfolio || data;
  }

  // Get specific portfolio
  async getPortfolio(portfolioId: string): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/portfolios/${portfolioId}?token=${this.token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get portfolio');
    }

    return await response.json();
  }

  // Transfer funds to portfolio
  async transferToPortfolio(portfolioId: string, amount: number): Promise<{ portfolio: Portfolio; client_cash: number }> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/portfolios/${portfolioId}/transfer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to transfer funds');
    }

    return await response.json();
  }

  // Withdraw from portfolio
  async withdrawFromPortfolio(portfolioId: string, amount: number): Promise<{ portfolio: Portfolio; client_cash: number }> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/portfolios/${portfolioId}/withdraw`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to withdraw funds');
    }

    return await response.json();
  }

  // Simulate portfolios for a client - THIS IS THE KEY ENDPOINT
  async simulateClient(clientId: string, months: number): Promise<{ results: SimulationResult[]; stockPriceData?: any }> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/client/${clientId}/simulate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ months }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to simulate portfolios');
    }

    return await response.json();
  }

  // Get RBC-based stock prices
  async getRBCStockPrices(clientId: string, months: number = 1): Promise<{ stocks: any[]; stockPriceData: any }> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/stocks/${clientId}?token=${this.token}&months=${months}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get RBC stock prices');
    }

    return await response.json();
  }

  // Get portfolio analysis
  async getPortfolioAnalysis(portfolioId: string): Promise<{
    portfolioId: string;
    trailingReturns: Record<string, string>;
    calendarReturns: Record<string, string>;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/rbc/portfolios/${portfolioId}/analysis?token=${this.token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get portfolio analysis');
    }

    return await response.json();
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Clear authentication
  clearAuth(): void {
    this.token = null;
    this.teamId = null;
  }
}

export const rbcApi = new RBCApiService();

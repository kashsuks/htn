// Game API Service - Calls our backend which proxies to RBC InvestEase API
const API_BASE_URL = 'http://localhost:3001/api';

export interface TeamRegistration {
  team_name: string;
  contact_email: string;
}

export interface TeamAuthResponse {
  teamId: string;
  jwtToken: string;
  expiresAt: string;
}

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

class GameApiService {
  private token: string | null = null;
  private teamId: string | null = null;

  // Register team and get JWT token
  async registerTeam(teamData: TeamRegistration): Promise<TeamAuthResponse> {
    const response = await fetch(`${API_BASE_URL}/rbc/teams/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register team');
    }

    const data: TeamAuthResponse = await response.json();
    this.token = data.jwtToken;
    this.teamId = data.teamId;
    
    // Store in localStorage for persistence
    localStorage.setItem('game_token', data.jwtToken);
    localStorage.setItem('game_teamId', data.teamId);
    
    return data;
  }

  // Initialize from stored token
  initializeFromStorage(): boolean {
    const token = localStorage.getItem('game_token');
    const teamId = localStorage.getItem('game_teamId');
    
    if (token && teamId) {
      this.token = token;
      this.teamId = teamId;
      return true;
    }
    return false;
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
    const response = await fetch(`${API_BASE_URL}/rbc/clients`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create client');
    }

    return await response.json();
  }

  // Get all clients for the team
  async getClients(): Promise<Client[]> {
    const response = await fetch(`${API_BASE_URL}/rbc/clients?token=${this.token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get clients');
    }

    return await response.json();
  }

  // Get specific client
  async getClient(clientId: string): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/rbc/clients/${clientId}?token=${this.token}`, {
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
    const response = await fetch(`${API_BASE_URL}/rbc/clients/${clientId}/portfolios`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(portfolioData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create portfolio');
    }

    return await response.json();
  }

  // Get portfolios for a client
  async getPortfolios(clientId: string): Promise<Portfolio[]> {
    const response = await fetch(`${API_BASE_URL}/rbc/clients/${clientId}/portfolios?token=${this.token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get portfolios');
    }

    return await response.json();
  }

  // Get specific portfolio
  async getPortfolio(portfolioId: string): Promise<Portfolio> {
    const response = await fetch(`${API_BASE_URL}/rbc/portfolios/${portfolioId}?token=${this.token}`, {
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
    const response = await fetch(`${API_BASE_URL}/rbc/portfolios/${portfolioId}/transfer`, {
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
    const response = await fetch(`${API_BASE_URL}/rbc/portfolios/${portfolioId}/withdraw`, {
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

  // Deposit to client cash
  async depositToClient(clientId: string, amount: number): Promise<{ client: Client }> {
    const response = await fetch(`${API_BASE_URL}/rbc/clients/${clientId}/deposit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deposit funds');
    }

    return await response.json();
  }

  // Simulate portfolios for a client
  async simulateClient(clientId: string, months: number): Promise<{ results: SimulationResult[] }> {
    const response = await fetch(`${API_BASE_URL}/rbc/client/${clientId}/simulate`, {
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

  // Get portfolio analysis
  async getPortfolioAnalysis(portfolioId: string): Promise<{
    portfolioId: string;
    trailingReturns: Record<string, string>;
    calendarReturns: Record<string, string>;
  }> {
    const response = await fetch(`${API_BASE_URL}/rbc/portfolios/${portfolioId}/analysis?token=${this.token}`, {
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
    localStorage.removeItem('game_token');
    localStorage.removeItem('game_teamId');
  }

  // AI Trading endpoints
  async startAITradingSession(gameConfig: any, rbcClientId: string, rbcPortfolioId: string, roundNumber: number): Promise<{ sessionId: string }> {
    const response = await fetch(`${API_BASE_URL}/rbc-trading/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        gameConfig,
        rbcClientId,
        rbcPortfolioId,
        roundNumber
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start AI trading session');
    }

    return await response.json();
  }

  async getAITradingSession(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/rbc-trading/${sessionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get AI trading session');
    }

    return await response.json();
  }

  async aiInvest(sessionId: string, rbcClientId: string, rbcPortfolioId: string, roundNumber: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/rbc-trading/${sessionId}/ai-invest`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        rbcClientId,
        rbcPortfolioId,
        token: this.token,
        roundNumber
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process AI investment');
    }

    return await response.json();
  }

  async completeAITradingSession(sessionId: string, finalValue: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/rbc-trading/${sessionId}/complete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ finalValue }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete AI trading session');
    }

    return await response.json();
  }
}

export const gameApi = new GameApiService();

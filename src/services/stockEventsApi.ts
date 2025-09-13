const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface StockEvent {
  symbol: string;
  price: number;
  volume?: number;
  change?: number;
  changePercent?: number;
  timestamp: string;
  eventType?: 'price_update' | 'trade' | 'news' | 'market_event';
  metadata?: any;
}

export interface StockHistoryParams {
  symbol: string;
  period?: '1h' | '4h' | '1d' | '1w' | '1m';
  interval?: '1m' | '5m' | '15m' | '1h' | '1d';
  startTime?: string;
  endTime?: string;
}

export interface TradingRecord {
  userId: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalValue: number;
  timestamp: string;
  gameSessionId?: string;
  roundNumber?: number;
}

export interface GameSession {
  userId: string;
  sessionId: string;
  gameType: 'battle' | 'practice' | 'tournament';
  rounds: number;
  finalScore: number;
  aiScore?: number;
  won: boolean;
  roundResults: any[];
  duration: number;
  completedAt: string;
}

class StockEventsAPI {
  private async getAuthHeaders(): Promise<HeadersInit> {
    // This would typically get the auth token from your auth context
    // For now, return empty headers
    return {
      'Content-Type': 'application/json',
    };
  }

  async saveStockEvent(event: StockEvent): Promise<StockEvent> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stock-events/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Failed to save stock event: ${response.statusText}`);
      }

      const result = await response.json();
      return result.stockEvent;
    } catch (error) {
      console.error('Error saving stock event:', error);
      throw error;
    }
  }

  async getStockEvents(symbol: string, startTime?: string, endTime?: string): Promise<StockEvent[]> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      if (startTime) params.append('startTime', startTime);
      if (endTime) params.append('endTime', endTime);

      const response = await fetch(`${API_BASE_URL}/api/stock-events/${symbol}?${params}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock events: ${response.statusText}`);
      }

      const result = await response.json();
      return result.stockEvents;
    } catch (error) {
      console.error('Error fetching stock events:', error);
      throw error;
    }
  }

  async getStockHistory(params: StockHistoryParams): Promise<StockEvent[]> {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.interval) queryParams.append('interval', params.interval);
      if (params.startTime) queryParams.append('startTime', params.startTime);
      if (params.endTime) queryParams.append('endTime', params.endTime);

      const response = await fetch(`${API_BASE_URL}/api/stock-events/history/${params.symbol}?${queryParams}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock history: ${response.statusText}`);
      }

      const result = await response.json();
      return result.chartData;
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw error;
    }
  }

  async getRecentStockEvents(symbol: string, hours: number = 24): Promise<StockEvent[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stock-events/recent/${symbol}?hours=${hours}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recent stock events: ${response.statusText}`);
      }

      const result = await response.json();
      return result.stockEvents;
    } catch (error) {
      console.error('Error fetching recent stock events:', error);
      throw error;
    }
  }

  async saveTradingRecord(record: TradingRecord): Promise<TradingRecord> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/trading-record`, {
        method: 'POST',
        headers,
        body: JSON.stringify(record),
      });

      if (!response.ok) {
        throw new Error(`Failed to save trading record: ${response.statusText}`);
      }

      const result = await response.json();
      return result.tradingRecord;
    } catch (error) {
      console.error('Error saving trading record:', error);
      throw error;
    }
  }

  async getTradingRecords(userId: string, limit: number = 50): Promise<TradingRecord[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/trading-records?limit=${limit}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trading records: ${response.statusText}`);
      }

      const result = await response.json();
      return result.tradingRecords;
    } catch (error) {
      console.error('Error fetching trading records:', error);
      throw error;
    }
  }

  async getGameSessions(userId: string, limit: number = 10): Promise<GameSession[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/game-sessions?limit=${limit}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch game sessions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.gameSessions;
    } catch (error) {
      console.error('Error fetching game sessions:', error);
      throw error;
    }
  }
}

export const stockEventsAPI = new StockEventsAPI();

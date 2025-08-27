import { 
  Player, 
  GameSession, 
  GameEvent, 
  LeaderboardEntry, 
  DashboardStats, 
  PlayersResponse, 
  LeaderboardResponse, 
  SubmitScoreRequest,
  FilterOptions,
  ApiResponse 
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Player endpoints
  async getPlayers(filters: FilterOptions = {}, page: number = 1, limit: number = 20): Promise<PlayersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters.search && { search: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
      ...(filters.minScore && { minScore: filters.minScore.toString() }),
      ...(filters.maxScore && { maxScore: filters.maxScore.toString() }),
      ...(filters.isBanned !== undefined && { isBanned: filters.isBanned.toString() }),
    });

    const response = await this.request<PlayersResponse>(`/api/players?${params}`);
    return response.data || { players: [], pagination: { page, limit, total: 0, pages: 0 } };
  }

  async getPlayer(walletAddress: string): Promise<Player | null> {
    const response = await this.request<Player>(`/api/players/${walletAddress}`);
    return response.success ? response.data || null : null;
  }

  async submitScore(data: SubmitScoreRequest): Promise<ApiResponse<any>> {
    return this.request('/api/submit-score', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Session endpoints
  async startSession(walletAddress: string, sessionId: string): Promise<ApiResponse<any>> {
    return this.request('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, session_id: sessionId }),
    });
  }

  async endSession(sessionId: string, finalScore: number, enemiesKilled: number, bombsUsed: number): Promise<ApiResponse<any>> {
    return this.request('/api/sessions/end', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        final_score: finalScore,
        enemies_killed: enemiesKilled,
        bombs_used: bombsUsed,
      }),
    });
  }

  // Admin endpoints
  async getLeaderboard(metric: 'score' | 'tokens' = 'score', limit: number = 50): Promise<LeaderboardResponse> {
    const response = await this.request<LeaderboardResponse>(`/api/admin/leaderboard?metric=${metric}&limit=${limit}`);
    return response.data || { leaderboard: [], metric, limit };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<DashboardStats>('/api/admin/stats');
    return response.data || {
      totalPlayers: 0,
      activePlayers24h: 0,
      totalScore: 0,
      totalTokens: 0,
      gamesPlayedToday: 0,
      averageScore: 0,
    };
  }

  async getEvents(filters: FilterOptions = {}, limit: number = 100): Promise<GameEvent[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(filters.search && { wallet: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
    });

    const response = await this.request<GameEvent[]>(`/api/admin/events?${params}`);
    return response.data || [];
  }

  async exportPlayers(filters: FilterOptions = {}): Promise<string> {
    const params = new URLSearchParams({
      ...(filters.search && { search: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
      ...(filters.minScore && { minScore: filters.minScore.toString() }),
    });

    const response = await fetch(`${this.baseUrl}/api/admin/export.csv?${params}`);
    if (!response.ok) {
      throw new Error('Failed to export data');
    }
    return response.text();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/healthz`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Real-time connection
  connectSocketIO(): any {
    try {
      const { io } = require('socket.io-client');
      return io(this.baseUrl, {
        transports: ['websocket', 'polling']
      });
    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error);
      return null;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;

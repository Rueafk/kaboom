export interface Player {
  id: string;
  wallet: string;
  username?: string;
  level: number;
  totalScore: number;
  boomTokens: number;
  lives: number;
  currentScore: number;
  experiencePoints: number;
  achievementsUnlocked: number;
  totalPlaytimeMinutes: number;
  gamesPlayed: number;
  gamesWon: number;
  highestLevelReached: number;
  longestSurvivalTime: number;
  totalEnemiesKilled: number;
  totalBombsUsed: number;
  lastActiveAt: string;
  createdAt: string;
  isBanned: boolean;
  banReason?: string;
  cheatScore: number;
}

export interface GameSession {
  id: string;
  walletAddress: string;
  sessionId: string;
  sessionStart: string;
  sessionEnd?: string;
  finalScore: number;
  enemiesKilled: number;
  bombsUsed: number;
  isValid: boolean;
  createdAt: string;
}

export interface GameEvent {
  id: string;
  playerId: string;
  type: 'score' | 'token' | 'level_up' | 'achievement' | 'game_start' | 'game_end';
  value: number;
  matchId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface LeaderboardEntry {
  wallet: string;
  username?: string;
  totalScore: number;
  boomTokens: number;
  gamesPlayed: number;
  lastActiveAt: string;
  rank: number;
}

export interface DashboardStats {
  totalPlayers: number;
  activePlayers24h: number;
  totalScore: number;
  totalTokens: number;
  gamesPlayedToday: number;
  averageScore: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlayersResponse {
  players: Player[];
  pagination: PaginationMeta;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  metric: 'score' | 'tokens';
  limit: number;
}

export interface SubmitScoreRequest {
  wallet: string;
  score: number;
  tokens: number;
  matchId: string;
  clientSig?: string;
  metadata?: Record<string, any>;
}

export interface AdminAuth {
  username: string;
  password: string;
}

export interface RealTimeUpdate {
  type: 'player_update' | 'new_score' | 'new_session' | 'player_connected';
  data: Player | GameEvent | GameSession;
  timestamp: string;
}

export interface FilterOptions {
  search?: string;
  from?: string;
  to?: string;
  minScore?: number;
  maxScore?: number;
  isBanned?: boolean;
}

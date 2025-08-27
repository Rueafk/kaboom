'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Activity, 
  Gamepad2, 
  Coins,
  BarChart3,
  RefreshCw,
  Download,
  Search,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

import { apiClient } from '@/lib/api';
import { Player, DashboardStats, LeaderboardEntry, FilterOptions } from '@/types';
import { formatWallet, formatNumber, formatDate, formatRelativeTime, isActivePlayer } from '@/lib/utils';

import StatsCard from '@/components/StatsCard';
import PlayersTable from '@/components/PlayersTable';
import LeaderboardChart from '@/components/LeaderboardChart';
import FilterPanel from '@/components/FilterPanel';
import LoginModal from '@/components/LoginModal';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    activePlayers24h: 0,
    totalScore: 0,
    totalTokens: 0,
    gamesPlayedToday: 0,
    averageScore: 0,
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!isAuthenticated || !isRealTimeEnabled) return;

    const socket = apiClient.connectSocketIO();
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Socket.IO connected');
      socket.emit('join-admin');
    });

    socket.on('admin-update', (update) => {
      handleRealTimeUpdate(update);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, isRealTimeEnabled]);

  const handleRealTimeUpdate = (update: any) => {
    setLastUpdate(new Date());
    
    switch (update.type) {
      case 'player_update':
        updatePlayerInList(update.data);
        break;
      case 'new_score':
        refreshStats();
        break;
      case 'new_session':
        refreshStats();
        break;
    }
  };

  const updatePlayerInList = (updatedPlayer: Player) => {
    setPlayers(prev => 
      prev.map(player => 
        player.wallet === updatedPlayer.wallet ? updatedPlayer : player
      )
    );
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [statsData, playersData, leaderboardData] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getPlayers(filters, currentPage),
        apiClient.getLeaderboard('score', 10),
      ]);

      setStats(statsData);
      setPlayers(playersData.players);
      setTotalPages(playersData.pagination.pages);
      setLeaderboard(leaderboardData.leaderboard);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const statsData = await apiClient.getDashboardStats();
      setStats(statsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  const handleFiltersChange = async (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
    
    try {
      const playersData = await apiClient.getPlayers(newFilters, 1);
      setPlayers(playersData.players);
      setTotalPages(playersData.pagination.pages);
    } catch (error) {
      console.error('Failed to apply filters:', error);
      toast.error('Failed to apply filters');
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    
    try {
      const playersData = await apiClient.getPlayers(filters, page);
      setPlayers(playersData.players);
    } catch (error) {
      console.error('Failed to change page:', error);
      toast.error('Failed to load page');
    }
  };

  const handleExport = async () => {
    try {
      const csvData = await apiClient.exportPlayers(filters);
      const filename = `kaboom-players-${new Date().toISOString().split('T')[0]}.csv`;
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleLogin = (token: string) => {
    localStorage.setItem('admin_token', token);
    setIsAuthenticated(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Gamepad2 className="h-8 w-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Kaboom Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/80">
                <Activity className="h-4 w-4" />
                <span className="text-sm">
                  Last update: {formatRelativeTime(lastUpdate)}
                </span>
              </div>
              
              <button
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  isRealTimeEnabled 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}
                title={isRealTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                {isRealTimeEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              
              <button
                onClick={refreshStats}
                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <StatsCard
              title="Total Players"
              value={formatNumber(stats.totalPlayers)}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Active (24h)"
              value={formatNumber(stats.activePlayers24h)}
              icon={Activity}
              color="green"
            />
            <StatsCard
              title="Total Score"
              value={formatNumber(stats.totalScore)}
              icon={TrendingUp}
              color="yellow"
            />
            <StatsCard
              title="Total Tokens"
              value={formatNumber(stats.totalTokens)}
              icon={Coins}
              color="purple"
            />
            <StatsCard
              title="Games Today"
              value={formatNumber(stats.gamesPlayedToday)}
              icon={Gamepad2}
              color="pink"
            />
            <StatsCard
              title="Avg Score"
              value={formatNumber(stats.averageScore)}
              icon={BarChart3}
              color="indigo"
            />
          </div>

          {/* Filters and Actions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Players Table */}
            <div className="xl:col-span-2">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
                <PlayersTable
                  players={players}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>

            {/* Leaderboard Chart */}
            <div className="xl:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Top Players</h2>
                <LeaderboardChart leaderboard={leaderboard} />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

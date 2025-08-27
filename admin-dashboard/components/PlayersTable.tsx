import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Trophy,
  Coins,
  Activity,
  Clock,
  User
} from 'lucide-react';
import { Player } from '@/types';
import { formatWallet, formatNumber, formatDate, formatRelativeTime, isActivePlayer, getScoreColor, getLevelColor } from '@/lib/utils';

interface PlayersTableProps {
  players: Player[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PlayersTable({ players, currentPage, totalPages, onPageChange }: PlayersTableProps) {
  const [sortField, setSortField] = useState<keyof Player>('totalScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Player) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const getSortIcon = (field: keyof Player) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-white/60">
          Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, players.length)} of {players.length} players
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No players found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-3 px-4 text-white/80 font-medium">
              <button
                onClick={() => handleSort('wallet')}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <span>Wallet</span>
                <span className="text-xs">{getSortIcon('wallet')}</span>
              </button>
            </th>
            <th className="text-left py-3 px-4 text-white/80 font-medium">
              <button
                onClick={() => handleSort('username')}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <span>Username</span>
                <span className="text-xs">{getSortIcon('username')}</span>
              </button>
            </th>
            <th className="text-left py-3 px-4 text-white/80 font-medium">
              <button
                onClick={() => handleSort('level')}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <span>Level</span>
                <span className="text-xs">{getSortIcon('level')}</span>
              </button>
            </th>
            <th className="text-left py-3 px-4 text-white/80 font-medium">
              <button
                onClick={() => handleSort('totalScore')}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <Trophy className="h-4 w-4" />
                <span>Score</span>
                <span className="text-xs">{getSortIcon('totalScore')}</span>
              </button>
            </th>
            <th className="text-left py-3 px-4 text-white/80 font-medium">
              <button
                onClick={() => handleSort('boomTokens')}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <Coins className="h-4 w-4" />
                <span>Tokens</span>
                <span className="text-xs">{getSortIcon('boomTokens')}</span>
              </button>
            </th>
            <th className="text-left py-3 px-4 text-white/80 font-medium">
              <button
                onClick={() => handleSort('gamesPlayed')}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <span>Games</span>
                <span className="text-xs">{getSortIcon('gamesPlayed')}</span>
              </button>
            </th>
            <th className="text-left py-3 px-4 text-white/80 font-medium">
              <button
                onClick={() => handleSort('lastActiveAt')}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <Clock className="h-4 w-4" />
                <span>Last Active</span>
                <span className="text-xs">{getSortIcon('lastActiveAt')}</span>
              </button>
            </th>
            <th className="text-left py-3 px-4 text-white/80 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <motion.tr
              key={player.wallet}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {player.username?.charAt(0) || player.wallet.charAt(0)}
                  </div>
                  <span className="text-white font-mono text-sm">{formatWallet(player.wallet)}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-white">{player.username || 'Anonymous'}</span>
              </td>
              <td className="py-3 px-4">
                <span className={`font-bold ${getLevelColor(player.level)}`}>
                  {player.level}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`font-bold ${getScoreColor(player.totalScore)}`}>
                  {formatNumber(player.totalScore)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-yellow-400 font-bold">
                  {formatNumber(player.boomTokens)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-white">{player.gamesPlayed}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-white/60 text-sm">
                  {formatRelativeTime(player.lastActiveAt)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                  {isActivePlayer(player.lastActiveAt) ? (
                    <div className="flex items-center space-x-1 text-green-400">
                      <Activity className="h-3 w-3" />
                      <span className="text-xs">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-white/40">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">Inactive</span>
                    </div>
                  )}
                  {player.isBanned && (
                    <span className="text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded">
                      Banned
                    </span>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      
      {renderPagination()}
    </div>
  );
}

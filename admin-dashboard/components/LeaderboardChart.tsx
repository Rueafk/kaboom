import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { LeaderboardEntry } from '@/types';
import { formatWallet, formatNumber } from '@/lib/utils';

interface LeaderboardChartProps {
  leaderboard: LeaderboardEntry[];
}

const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

export default function LeaderboardChart({ leaderboard }: LeaderboardChartProps) {
  const chartData = leaderboard.slice(0, 10).map((entry, index) => ({
    name: formatWallet(entry.wallet),
    score: entry.totalScore,
    tokens: entry.boomTokens,
    rank: index + 1,
    wallet: entry.wallet,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-3 text-white">
          <p className="font-bold mb-2">#{data.rank} - {label}</p>
          <p className="text-yellow-400">Score: {formatNumber(data.score)}</p>
          <p className="text-purple-400">Tokens: {formatNumber(data.tokens)}</p>
          <p className="text-xs text-white/60 mt-1">{data.wallet}</p>
        </div>
      );
    }
    return null;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-400" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-300" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-xs font-bold text-white/60">#{rank}</span>;
    }
  };

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No leaderboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Players List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white mb-4">Top Players</h3>
        {leaderboard.slice(0, 5).map((player, index) => (
          <motion.div
            key={player.wallet}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500">
                {getRankIcon(index + 1)}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {player.username || formatWallet(player.wallet)}
                </p>
                <p className="text-white/60 text-xs">
                  {formatWallet(player.wallet)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold text-sm">
                {formatNumber(player.totalScore)}
              </p>
              <p className="text-purple-400 text-xs">
                {formatNumber(player.boomTokens)} tokens
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

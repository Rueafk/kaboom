# 🚀 Enhanced Kaboom Backend System

## Overview

The Enhanced Kaboom Backend is a comprehensive, production-ready server system designed specifically for the Pirate Bomb game. It features advanced analytics, anti-cheat protection, achievement systems, and real-time data management.

## 🏗️ Architecture

### Core Components
- **Express.js Server** - Fast, unopinionated web framework
- **SQLite Database** - Lightweight, serverless database
- **CORS Protection** - Secure cross-origin resource sharing
- **Rate Limiting** - API protection against abuse
- **Anti-Cheat System** - Session validation and cheat detection

## 📊 Database Schema

### Enhanced Tables

#### 1. **players** - Player Profiles
```sql
- id (PRIMARY KEY)
- wallet_address (UNIQUE)
- username, level, total_score, boom_tokens
- experience_points, achievements_unlocked
- total_playtime_minutes, games_played, games_won
- highest_level_reached, longest_survival_time
- total_enemies_killed, total_bombs_used
- last_updated, created_at, last_login
- is_banned, ban_reason, cheat_score
```

#### 2. **game_sessions** - Session Tracking
```sql
- id (PRIMARY KEY)
- wallet_address, session_id (UNIQUE)
- session_start, session_end
- score_earned, tokens_earned
- enemies_killed, levels_completed, bombs_used
- survival_time_seconds, level_reached
- session_hash, is_valid
```

#### 3. **achievements** - Achievement System
```sql
- id (PRIMARY KEY)
- achievement_id (UNIQUE)
- name, description, token_reward, xp_reward
- icon_url, is_active
```

#### 4. **player_achievements** - Player Achievement Tracking
```sql
- id (PRIMARY KEY)
- wallet_address, achievement_id
- unlocked_at, tokens_claimed, xp_claimed
```

#### 5. **leaderboards** - Dynamic Leaderboards
```sql
- id (PRIMARY KEY)
- leaderboard_type, wallet_address
- username, score, rank
- last_updated
```

#### 6. **anti_cheat_logs** - Security Monitoring
```sql
- id (PRIMARY KEY)
- wallet_address, session_id
- cheat_type, cheat_score, details
- timestamp
```

#### 7. **recharge_tracking** - Life System
```sql
- id (PRIMARY KEY)
- wallet_address (UNIQUE)
- lives_remaining, last_recharge_time
- recharge_cooldown_end, is_recharging
- total_recharges, created_at, updated_at
```

## 🔌 API Endpoints

### Player Management

#### `GET /api/players`
- **Purpose**: Get all players with pagination and filtering
- **Query Parameters**:
  - `page` (default: 1) - Page number
  - `limit` (default: 20) - Items per page
  - `sort` (default: 'total_score') - Sort field
  - `order` (default: 'DESC') - Sort order
  - `search` - Search term for wallet/username
- **Response**: Paginated player list with metadata

#### `POST /api/players`
- **Purpose**: Create or update player data
- **Body**: Player information (wallet_address, username, level, etc.)
- **Features**: Automatic achievement checking

### Session Management

#### `POST /api/sessions/start`
- **Purpose**: Start a new game session
- **Body**: `{ wallet_address }`
- **Response**: `{ session_id, success }`

#### `POST /api/sessions/end`
- **Purpose**: End game session with anti-cheat validation
- **Body**: Session data (score, tokens, enemies, etc.)
- **Features**: 
  - Cheat score calculation
  - Session hash generation
  - Automatic stats update
  - Achievement checking

### Achievement System

#### `GET /api/players/:walletAddress/achievements`
- **Purpose**: Get player's unlocked achievements
- **Response**: List of achievements with rewards

### Leaderboards

#### `GET /api/leaderboards/:type`
- **Types**: `score`, `level`, `tokens`, `achievements`
- **Query Parameters**: `limit` (default: 10)
- **Response**: Ranked player list

### Analytics

#### `GET /api/analytics/dashboard`
- **Purpose**: Comprehensive game analytics
- **Response**: 
  - Total players, games, tokens, scores
  - Average levels, scores, tokens
  - Top players, recent activity
  - Achievement and gameplay statistics

### Recharge System

#### `GET /api/recharge/:walletAddress`
- **Purpose**: Get player's recharge status
- **Response**: Lives remaining, cooldown status, playability

### Health & Monitoring

#### `GET /api/health`
- **Purpose**: Server health check
- **Response**: Status, database connection, player count, uptime

## 🛡️ Security Features

### Anti-Cheat System
- **Session Validation**: Hash-based session verification
- **Score Analysis**: Impossible score detection
- **Time Analysis**: Suspicious completion times
- **Progressive Monitoring**: Cheat score accumulation
- **Automatic Flagging**: Suspicious sessions marked for review

### Rate Limiting
- **API Protection**: 100 requests per 15 minutes per IP
- **Abuse Prevention**: Automatic blocking of excessive requests

### Data Validation
- **Input Sanitization**: All user inputs validated
- **SQL Injection Prevention**: Parameterized queries
- **Session Integrity**: Cryptographic session hashes

## 🏆 Achievement System

### Default Achievements
1. **First Steps** - Complete first game (50 tokens, 100 XP)
2. **Rising Star** - Reach level 10 (200 tokens, 500 XP)
3. **Veteran Player** - Reach level 25 (500 tokens, 1000 XP)
4. **Score Master** - Earn 10,000 total score (300 tokens, 750 XP)
5. **Enemy Hunter** - Kill 100 enemies (150 tokens, 300 XP)
6. **Bomb Expert** - Use 50 bombs (100 tokens, 200 XP)
7. **Survivor** - Survive 5 minutes (250 tokens, 600 XP)
8. **Perfect Run** - Complete level without damage (400 tokens, 800 XP)

### Achievement Features
- **Automatic Detection**: Real-time achievement checking
- **Reward Distribution**: Automatic token and XP awards
- **Duplicate Prevention**: One-time achievement unlocking
- **Progress Tracking**: Detailed achievement history

## 📈 Analytics & Monitoring

### Real-Time Metrics
- **Player Statistics**: Total players, active users
- **Game Performance**: Games played, completion rates
- **Economic Metrics**: Token distribution, earning rates
- **Engagement Data**: Session times, retention rates

### Performance Monitoring
- **Database Health**: Connection status, query performance
- **Server Metrics**: Uptime, response times
- **Error Tracking**: Detailed error logging and monitoring

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=production          # Environment mode
```

### Database Configuration
- **Type**: SQLite (file-based)
- **Location**: `./player_data.db`
- **Backup**: Automatic backup on server shutdown

## 🚀 Deployment

### Prerequisites
```bash
npm install express sqlite3 cors body-parser
```

### Start Server
```bash
# Development
npm run dev

# Production
npm start
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 📊 API Response Examples

### Player List
```json
{
  "players": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Session End
```json
{
  "success": true,
  "session_valid": true,
  "cheat_score": 0.1,
  "message": "Session completed successfully"
}
```

### Analytics Dashboard
```json
{
  "totalPlayers": {"count": 150},
  "totalGames": {"total": 2500},
  "totalTokens": {"total": 125000},
  "avgLevel": {"average": 8.5},
  "topPlayer": {"username": "Player1", "total_score": 15000}
}
```

## 🔍 Troubleshooting

### Common Issues
1. **Database Connection Error**: Check file permissions
2. **Port Already in Use**: Change PORT environment variable
3. **CORS Errors**: Verify origin configuration
4. **Rate Limiting**: Check request frequency

### Logs
- **Server Logs**: Console output with timestamps
- **Error Logs**: Detailed error information
- **Anti-Cheat Logs**: Suspicious activity tracking

## 🎯 Future Enhancements

### Planned Features
- **Real-time WebSocket Support**: Live leaderboards
- **Advanced Analytics**: Machine learning insights
- **Multi-chain Support**: Additional blockchain networks
- **Tournament System**: Competitive gameplay
- **Social Features**: Friends, clans, messaging
- **Mobile API**: Optimized mobile endpoints

### Performance Optimizations
- **Database Indexing**: Query performance improvements
- **Caching Layer**: Redis integration
- **Load Balancing**: Multiple server instances
- **CDN Integration**: Static asset optimization

---

**🎮 Enhanced Kaboom Backend - Built for Scale, Security, and Performance**

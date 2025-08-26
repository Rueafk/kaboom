const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced middleware with security
const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://kaboom-game.koyeb.app', 'https://kaboom-game-rueafk.koyeb.app', 'https://favourable-elicia-afk-a1f42961.koyeb.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'null', 'file://'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Admin dashboard route - must come BEFORE static file serving
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

app.use(express.static('.'));

// Database setup with enhanced error handling
const db = new sqlite3.Database('./player_data.db', (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database');
        createEnhancedTables();
    }
});

// Enhanced table creation with new features
function createEnhancedTables() {
    db.serialize(() => {
        // Enhanced Players table
        db.run(`CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT UNIQUE NOT NULL,
            username TEXT,
            level INTEGER DEFAULT 1,
            total_score INTEGER DEFAULT 0,
            boom_tokens INTEGER DEFAULT 0,
            lives INTEGER DEFAULT 3,
            current_score INTEGER DEFAULT 0,
            experience_points INTEGER DEFAULT 0,
            achievements_unlocked INTEGER DEFAULT 0,
            total_playtime_minutes INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            games_won INTEGER DEFAULT 0,
            highest_level_reached INTEGER DEFAULT 1,
            longest_survival_time INTEGER DEFAULT 0,
            total_enemies_killed INTEGER DEFAULT 0,
            total_bombs_used INTEGER DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_banned BOOLEAN DEFAULT 0,
            ban_reason TEXT,
            cheat_score REAL DEFAULT 0.0
        )`);

        // Enhanced Recharge tracking
        db.run(`CREATE TABLE IF NOT EXISTS recharge_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT UNIQUE NOT NULL,
            lives_remaining INTEGER DEFAULT 3,
            last_recharge_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            recharge_cooldown_end DATETIME,
            is_recharging BOOLEAN DEFAULT 0,
            total_recharges INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Enhanced Game sessions
        db.run(`CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            session_id TEXT UNIQUE NOT NULL,
            session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_end DATETIME,
            score_earned INTEGER DEFAULT 0,
            tokens_earned INTEGER DEFAULT 0,
            enemies_killed INTEGER DEFAULT 0,
            levels_completed INTEGER DEFAULT 0,
            bombs_used INTEGER DEFAULT 0,
            survival_time_seconds INTEGER DEFAULT 0,
            level_reached INTEGER DEFAULT 1,
            session_hash TEXT,
            is_valid BOOLEAN DEFAULT 1
        )`);

        // Achievements system
        db.run(`CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            achievement_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            token_reward INTEGER DEFAULT 0,
            xp_reward INTEGER DEFAULT 0,
            icon_url TEXT,
            is_active BOOLEAN DEFAULT 1
        )`);

        // Player achievements
        db.run(`CREATE TABLE IF NOT EXISTS player_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            achievement_id TEXT NOT NULL,
            unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            tokens_claimed INTEGER DEFAULT 0,
            xp_claimed INTEGER DEFAULT 0,
            UNIQUE(wallet_address, achievement_id)
        )`);

        // Leaderboards
        db.run(`CREATE TABLE IF NOT EXISTS leaderboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leaderboard_type TEXT NOT NULL,
            wallet_address TEXT NOT NULL,
            username TEXT,
            score INTEGER DEFAULT 0,
            rank INTEGER,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(leaderboard_type, wallet_address)
        )`);

        // Daily challenges
        db.run(`CREATE TABLE IF NOT EXISTS daily_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_date DATE UNIQUE NOT NULL,
            challenge_type TEXT NOT NULL,
            challenge_description TEXT,
            target_value INTEGER,
            token_reward INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1
        )`);

        // Player challenge progress
        db.run(`CREATE TABLE IF NOT EXISTS player_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            challenge_date DATE NOT NULL,
            progress INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT 0,
            claimed BOOLEAN DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(wallet_address, challenge_date)
        )`);

        // Anti-cheat logs
        db.run(`CREATE TABLE IF NOT EXISTS anti_cheat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT NOT NULL,
            session_id TEXT,
            cheat_type TEXT NOT NULL,
            cheat_score REAL DEFAULT 0.0,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Admin actions with enhanced logging
        db.run(`CREATE TABLE IF NOT EXISTS admin_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_ip TEXT,
            admin_wallet TEXT,
            action_type TEXT NOT NULL,
            target_wallet TEXT,
            action_details TEXT,
            severity TEXT DEFAULT 'INFO',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Game analytics
        db.run(`CREATE TABLE IF NOT EXISTS game_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            total_players INTEGER DEFAULT 0,
            total_games_played INTEGER DEFAULT 0,
            total_tokens_earned INTEGER DEFAULT 0,
            total_score_earned INTEGER DEFAULT 0,
            avg_session_time INTEGER DEFAULT 0,
            retention_rate REAL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insert default achievements
        insertDefaultAchievements();
        
        console.log('✅ Enhanced database tables created successfully');
    });
}

// Insert default achievements
function insertDefaultAchievements() {
    const achievements = [
        {
            achievement_id: 'FIRST_GAME',
            name: 'First Steps',
            description: 'Complete your first game',
            token_reward: 50,
            xp_reward: 100
        },
        {
            achievement_id: 'LEVEL_10',
            name: 'Rising Star',
            description: 'Reach level 10',
            token_reward: 200,
            xp_reward: 500
        },
        {
            achievement_id: 'LEVEL_25',
            name: 'Veteran Player',
            description: 'Reach level 25',
            token_reward: 500,
            xp_reward: 1000
        },
        {
            achievement_id: 'SCORE_10000',
            name: 'Score Master',
            description: 'Earn 10,000 total score',
            token_reward: 300,
            xp_reward: 750
        },
        {
            achievement_id: 'ENEMIES_100',
            name: 'Enemy Hunter',
            description: 'Kill 100 enemies',
            token_reward: 150,
            xp_reward: 300
        },
        {
            achievement_id: 'BOMBS_50',
            name: 'Bomb Expert',
            description: 'Use 50 bombs',
            token_reward: 100,
            xp_reward: 200
        },
        {
            achievement_id: 'SURVIVAL_300',
            name: 'Survivor',
            description: 'Survive 5 minutes in a single game',
            token_reward: 250,
            xp_reward: 600
        },
        {
            achievement_id: 'PERFECT_GAME',
            name: 'Perfect Run',
            description: 'Complete a level without taking damage',
            token_reward: 400,
            xp_reward: 800
        }
    ];

    achievements.forEach(achievement => {
        db.run(`
            INSERT OR IGNORE INTO achievements 
            (achievement_id, name, description, token_reward, xp_reward)
            VALUES (?, ?, ?, ?, ?)
        `, [achievement.achievement_id, achievement.name, achievement.description, achievement.token_reward, achievement.xp_reward]);
    });
}

// Utility functions
function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

function calculateCheatScore(sessionData) {
    let score = 0.0;
    
    // Check for impossible scores
    if (sessionData.score_earned > 10000 && sessionData.survival_time_seconds < 60) {
        score += 0.5;
    }
    
    // Check for impossible level progression
    if (sessionData.levels_completed > 5 && sessionData.survival_time_seconds < 300) {
        score += 0.3;
    }
    
    // Check for impossible enemy kills
    if (sessionData.enemies_killed > 50 && sessionData.survival_time_seconds < 120) {
        score += 0.4;
    }
    
    return Math.min(score, 1.0);
}

console.log('🚀 Enhanced Kaboom Server initialized');
console.log('📊 Database tables created');
console.log('🏆 Achievement system ready');
console.log('🛡️ Anti-cheat system active');
console.log('📈 Analytics system ready');

// Enhanced API Routes

// Get all players with pagination and filtering
app.get('/api/players', (req, res) => {
    const { page = 1, limit = 20, sort = 'total_score', order = 'DESC', search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM players WHERE is_banned = 0';
    let params = [];
    
    if (search) {
        query += ' AND (wallet_address LIKE ? OR username LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM players WHERE is_banned = 0';
        if (search) {
            countQuery += ' AND (wallet_address LIKE ? OR username LIKE ?)';
        }
        
        db.get(countQuery, search ? [`%${search}%`, `%${search}%`] : [], (err, countResult) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                players: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Enhanced player creation/update
app.post('/api/players', (req, res) => {
    console.log('🔍 POST /api/players called with body:', req.body);
    
    const { 
        wallet_address, 
        username, 
        level, 
        total_score, 
        boom_tokens, 
        lives, 
        current_score,
        experience_points = 0,
        games_played = 0,
        games_won = 0,
        total_enemies_killed = 0,
        total_bombs_used = 0
    } = req.body;
    
    // Validate required fields
    if (!wallet_address) {
        console.error('❌ Missing wallet_address in request');
        return res.status(400).json({ error: 'wallet_address is required' });
    }
    
    console.log('📝 Processing player data:', {
        wallet_address,
        username,
        level,
        total_score,
        boom_tokens,
        lives,
        current_score
    });
    
    const query = `
        INSERT OR REPLACE INTO players 
        (wallet_address, username, level, total_score, boom_tokens, lives, current_score, 
         experience_points, games_played, games_won, total_enemies_killed, total_bombs_used, 
         last_updated, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const params = [wallet_address, username, level, total_score, boom_tokens, lives, current_score,
                   experience_points, games_played, games_won, total_enemies_killed, total_bombs_used];
    
    console.log('🔍 Executing query with params:', params);
    
    db.run(query, params, function(err) {
        if (err) {
            console.error('❌ Database error in POST /api/players:', err);
            console.error('❌ Error details:', {
                code: err.code,
                message: err.message,
                stack: err.stack
            });
            res.status(500).json({ error: err.message, details: err.code });
            return;
        }
        
        console.log('✅ Player data saved successfully, lastID:', this.lastID);
        
        // Check for achievements
        checkAndAwardAchievements(wallet_address);
        
        res.json({ 
            success: true, 
            message: 'Player data saved successfully',
            id: this.lastID 
        });
    });
});

// Start game session
app.post('/api/sessions/start', (req, res) => {
    console.log('🔍 POST /api/sessions/start called with body:', req.body);
    
    const { wallet_address } = req.body;
    
    // Validate required fields
    if (!wallet_address) {
        console.error('❌ Missing wallet_address in request');
        return res.status(400).json({ error: 'wallet_address is required' });
    }
    
    const sessionId = generateSessionId();
    console.log('🎮 Starting session for wallet:', wallet_address, 'with session ID:', sessionId);
    
    const query = `
        INSERT INTO game_sessions 
        (wallet_address, session_id, session_start)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(query, [wallet_address, sessionId], function(err) {
        if (err) {
            console.error('❌ Database error in POST /api/sessions/start:', err);
            console.error('❌ Error details:', {
                code: err.code,
                message: err.message,
                stack: err.stack
            });
            res.status(500).json({ error: err.message, details: err.code });
            return;
        }
        
        console.log('✅ Game session started successfully, session ID:', sessionId);
        
        res.json({
            success: true,
            session_id: sessionId,
            message: 'Game session started'
        });
    });
});

// End game session with anti-cheat
app.post('/api/sessions/end', (req, res) => {
    const { 
        session_id, 
        wallet_address, 
        score_earned, 
        tokens_earned, 
        enemies_killed, 
        levels_completed,
        bombs_used,
        survival_time_seconds,
        level_reached
    } = req.body;
    
    // Calculate cheat score
    const cheatScore = calculateCheatScore({
        score_earned,
        survival_time_seconds,
        levels_completed,
        enemies_killed
    });
    
    // Generate session hash for verification
    const sessionHash = crypto.createHash('sha256')
        .update(`${session_id}${wallet_address}${score_earned}${Date.now()}`)
        .digest('hex');
    
    const query = `
        UPDATE game_sessions 
        SET session_end = CURRENT_TIMESTAMP,
            score_earned = ?,
            tokens_earned = ?,
            enemies_killed = ?,
            levels_completed = ?,
            bombs_used = ?,
            survival_time_seconds = ?,
            level_reached = ?,
            session_hash = ?,
            is_valid = ?
        WHERE session_id = ? AND wallet_address = ?
    `;
    
    const isValid = cheatScore < 0.7; // Threshold for valid session
    
    db.run(query, [score_earned, tokens_earned, enemies_killed, levels_completed,
                   bombs_used, survival_time_seconds, level_reached, sessionHash, isValid ? 1 : 0,
                   session_id, wallet_address], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Log anti-cheat detection
        if (cheatScore > 0.3) {
            db.run(`
                INSERT INTO anti_cheat_logs 
                (wallet_address, session_id, cheat_type, cheat_score, details)
                VALUES (?, ?, ?, ?, ?)
            `, [wallet_address, session_id, 'SUSPICIOUS_ACTIVITY', cheatScore, 
                 `Score: ${score_earned}, Time: ${survival_time_seconds}s, Levels: ${levels_completed}`]);
        }
        
        // Update player stats if session is valid
        if (isValid) {
            updatePlayerStats(wallet_address, {
                score_earned,
                tokens_earned,
                enemies_killed,
                levels_completed,
                bombs_used,
                survival_time_seconds,
                level_reached
            });
        }
        
        res.json({
            success: true,
            session_valid: isValid,
            cheat_score: cheatScore,
            message: isValid ? 'Session completed successfully' : 'Session flagged for review'
        });
    });
});

// Update player stats
function updatePlayerStats(wallet_address, sessionData) {
    const query = `
        UPDATE players 
        SET total_score = total_score + ?,
            boom_tokens = boom_tokens + ?,
            total_enemies_killed = total_enemies_killed + ?,
            total_bombs_used = total_bombs_used + ?,
            games_played = games_played + 1,
            highest_level_reached = CASE WHEN ? > highest_level_reached THEN ? ELSE highest_level_reached END,
            longest_survival_time = CASE WHEN ? > longest_survival_time THEN ? ELSE longest_survival_time END,
            last_updated = CURRENT_TIMESTAMP
        WHERE wallet_address = ?
    `;
    
    db.run(query, [
        sessionData.score_earned,
        sessionData.tokens_earned,
        sessionData.enemies_killed,
        sessionData.bombs_used,
        sessionData.level_reached,
        sessionData.level_reached,
        sessionData.survival_time_seconds,
        sessionData.survival_time_seconds,
        wallet_address
    ], function(err) {
        if (err) {
            console.error('Error updating player stats:', err);
        } else {
            // Check for achievements after stats update
            checkAndAwardAchievements(wallet_address);
        }
    });
}

// Check and award achievements
function checkAndAwardAchievements(wallet_address) {
    // Get player stats
    db.get('SELECT * FROM players WHERE wallet_address = ?', [wallet_address], (err, player) => {
        if (err || !player) return;
        
        // Check each achievement
        const achievementChecks = [
            {
                id: 'FIRST_GAME',
                condition: player.games_played >= 1
            },
            {
                id: 'LEVEL_10',
                condition: player.level >= 10
            },
            {
                id: 'LEVEL_25',
                condition: player.level >= 25
            },
            {
                id: 'SCORE_10000',
                condition: player.total_score >= 10000
            },
            {
                id: 'ENEMIES_100',
                condition: player.total_enemies_killed >= 100
            },
            {
                id: 'BOMBS_50',
                condition: player.total_bombs_used >= 50
            }
        ];
        
        achievementChecks.forEach(check => {
            if (check.condition) {
                awardAchievement(wallet_address, check.id);
            }
        });
    });
}

// Award achievement to player
function awardAchievement(wallet_address, achievementId) {
    // Check if already awarded
    db.get('SELECT * FROM player_achievements WHERE wallet_address = ? AND achievement_id = ?', 
           [wallet_address, achievementId], (err, existing) => {
        if (err || existing) return;
        
        // Get achievement details
        db.get('SELECT * FROM achievements WHERE achievement_id = ?', [achievementId], (err, achievement) => {
            if (err || !achievement) return;
            
            // Award achievement
            db.run(`
                INSERT INTO player_achievements 
                (wallet_address, achievement_id, unlocked_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `, [wallet_address, achievementId], function(err) {
                if (err) {
                    console.error('Error awarding achievement:', err);
                    return;
                }
                
                // Update player stats
                db.run(`
                    UPDATE players 
                    SET achievements_unlocked = achievements_unlocked + 1,
                        boom_tokens = boom_tokens + ?,
                        experience_points = experience_points + ?
                    WHERE wallet_address = ?
                `, [achievement.token_reward, achievement.xp_reward, wallet_address]);
                
                console.log(`🏆 Achievement awarded: ${achievement.name} to ${wallet_address}`);
            });
        });
    });
}

// Get individual player profile
app.get('/api/players/:walletAddress', (req, res) => {
    const walletAddress = req.params.walletAddress;
    
    const query = 'SELECT * FROM players WHERE wallet_address = ?';
    
    db.get(query, [walletAddress], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Player not found' });
        }
    });
});

// Get player achievements
app.get('/api/players/:walletAddress/achievements', (req, res) => {
    const walletAddress = req.params.walletAddress;
    
    const query = `
        SELECT pa.*, a.name, a.description, a.token_reward, a.xp_reward, a.icon_url
        FROM player_achievements pa
        JOIN achievements a ON pa.achievement_id = a.achievement_id
        WHERE pa.wallet_address = ?
        ORDER BY pa.unlocked_at DESC
    `;
    
    db.all(query, [walletAddress], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get leaderboards
app.get('/api/leaderboards/:type', (req, res) => {
    const type = req.params.type;
    const { limit = 10 } = req.query;
    
    let query = '';
    switch(type) {
        case 'score':
            query = 'SELECT wallet_address, username, total_score as score FROM players WHERE is_banned = 0 ORDER BY total_score DESC LIMIT ?';
            break;
        case 'level':
            query = 'SELECT wallet_address, username, level as score FROM players WHERE is_banned = 0 ORDER BY level DESC LIMIT ?';
            break;
        case 'tokens':
            query = 'SELECT wallet_address, username, boom_tokens as score FROM players WHERE is_banned = 0 ORDER BY boom_tokens DESC LIMIT ?';
            break;
        case 'achievements':
            query = 'SELECT wallet_address, username, achievements_unlocked as score FROM players WHERE is_banned = 0 ORDER BY achievements_unlocked DESC LIMIT ?';
            break;
        default:
            res.status(400).json({ error: 'Invalid leaderboard type' });
            return;
    }
    
    db.all(query, [limit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Add ranks
        const leaderboard = rows.map((row, index) => ({
            ...row,
            rank: index + 1
        }));
        
        res.json(leaderboard);
    });
});

// Enhanced recharge system
app.get('/api/recharge/:walletAddress', (req, res) => {
    const walletAddress = req.params.walletAddress;
    
    db.get('SELECT * FROM recharge_tracking WHERE wallet_address = ?', [walletAddress], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            const now = new Date();
            const cooldownEnd = row.recharge_cooldown_end ? new Date(row.recharge_cooldown_end) : null;
            const isRecharging = cooldownEnd && now < cooldownEnd;
            const timeRemaining = isRecharging ? Math.max(0, cooldownEnd - now) : 0;
            
            // Auto-complete recharge if cooldown has expired
            if (row.is_recharging && cooldownEnd && now >= cooldownEnd) {
                // Update database to complete the recharge
                db.run(`
                    UPDATE recharge_tracking 
                    SET lives_remaining = 3, 
                        is_recharging = 0, 
                        recharge_cooldown_end = NULL,
                        last_recharge_time = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE wallet_address = ?
                `, [walletAddress], function(err) {
                    if (err) {
                        console.error('Error auto-completing recharge:', err);
                    }
                });
                
                // Return completed recharge status
                res.json({
                    wallet_address: row.wallet_address,
                    lives_remaining: 3,
                    is_recharging: false,
                    time_remaining_ms: 0,
                    time_remaining_minutes: 0,
                    can_play: true,
                    total_recharges: row.total_recharges,
                    last_recharge_time: row.last_recharge_time,
                    recharge_cooldown_end: null
                });
                return;
            }
            
            res.json({
                wallet_address: row.wallet_address,
                lives_remaining: row.lives_remaining,
                is_recharging: isRecharging,
                time_remaining_ms: timeRemaining,
                time_remaining_minutes: Math.ceil(timeRemaining / (1000 * 60)),
                can_play: !isRecharging && row.lives_remaining > 0,
                total_recharges: row.total_recharges,
                last_recharge_time: row.last_recharge_time,
                recharge_cooldown_end: row.recharge_cooldown_end
            });
        } else {
            res.json({
                wallet_address: walletAddress,
                lives_remaining: 3,
                is_recharging: false,
                time_remaining_ms: 0,
                time_remaining_minutes: 0,
                can_play: true,
                total_recharges: 0,
                last_recharge_time: null,
                recharge_cooldown_end: null
            });
        }
    });
});

// Start recharge cooldown (called when player loses all lives)
app.post('/api/recharge/start/:walletAddress', (req, res) => {
    const walletAddress = req.params.walletAddress;
    const cooldownMinutes = 45; // 45 minutes cooldown
    const cooldownEnd = new Date(Date.now() + (cooldownMinutes * 60 * 1000));
    
    const query = `
        INSERT OR REPLACE INTO recharge_tracking 
        (wallet_address, lives_remaining, recharge_cooldown_end, is_recharging, updated_at)
        VALUES (?, 0, ?, 1, CURRENT_TIMESTAMP)
    `;
    
    db.run(query, [walletAddress, cooldownEnd.toISOString()], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            success: true,
            wallet_address: walletAddress,
            recharge_cooldown_end: cooldownEnd.toISOString(),
            time_remaining_ms: cooldownMinutes * 60 * 1000,
            time_remaining_minutes: cooldownMinutes,
            lives_remaining: 0,
            is_recharging: true
        });
    });
});

// Complete recharge (called when cooldown is finished)
app.post('/api/recharge/complete/:walletAddress', (req, res) => {
    const walletAddress = req.params.walletAddress;
    
    const query = `
        UPDATE recharge_tracking 
        SET lives_remaining = 3, 
            is_recharging = 0, 
            recharge_cooldown_end = NULL,
            last_recharge_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE wallet_address = ?
    `;
    
    db.run(query, [walletAddress], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            success: true,
            wallet_address: walletAddress,
            lives_remaining: 3,
            is_recharging: false
        });
    });
});

// Update lives remaining (called when player takes damage)
app.put('/api/recharge/lives/:walletAddress', (req, res) => {
    console.log('🔍 PUT /api/recharge/lives/:walletAddress called');
    console.log('🔍 Wallet address:', req.params.walletAddress);
    console.log('🔍 Request body:', req.body);
    
    const walletAddress = req.params.walletAddress;
    const { lives_remaining } = req.body;
    
    // Validate required fields
    if (!walletAddress) {
        console.error('❌ Missing wallet_address in params');
        return res.status(400).json({ error: 'wallet_address is required' });
    }
    
    if (lives_remaining === undefined || lives_remaining === null) {
        console.error('❌ Missing lives_remaining in body');
        return res.status(400).json({ error: 'lives_remaining is required' });
    }
    
    if (lives_remaining < 0 || lives_remaining > 3) {
        console.error('❌ Invalid lives count:', lives_remaining);
        res.status(400).json({ error: 'Invalid lives count' });
        return;
    }
    
    console.log('📝 Updating lives for wallet:', walletAddress, 'to:', lives_remaining);
    
    const query = `
        INSERT OR REPLACE INTO recharge_tracking 
        (wallet_address, lives_remaining, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(query, [walletAddress, lives_remaining], function(err) {
        if (err) {
            console.error('❌ Database error in PUT /api/recharge/lives/:walletAddress:', err);
            console.error('❌ Error details:', {
                code: err.code,
                message: err.message,
                stack: err.stack
            });
            res.status(500).json({ error: err.message, details: err.code });
            return;
        }
        
        console.log('✅ Lives updated successfully for wallet:', walletAddress);
        
        res.json({
            success: true,
            wallet_address: walletAddress,
            lives_remaining: lives_remaining
        });
    });
});



// Enhanced analytics
app.get('/api/analytics/dashboard', (req, res) => {
    const queries = {
        totalPlayers: 'SELECT COUNT(*) as count FROM players WHERE is_banned = 0',
        totalGames: 'SELECT SUM(games_played) as total FROM players',
        totalTokens: 'SELECT SUM(boom_tokens) as total FROM players',
        totalScore: 'SELECT SUM(total_score) as total FROM players',
        avgLevel: 'SELECT AVG(level) as average FROM players WHERE is_banned = 0',
        avgScore: 'SELECT AVG(total_score) as average FROM players WHERE is_banned = 0',
        avgTokens: 'SELECT AVG(boom_tokens) as average FROM players WHERE is_banned = 0',
        topPlayer: 'SELECT username, total_score FROM players WHERE is_banned = 0 ORDER BY total_score DESC LIMIT 1',
        recentActivity: 'SELECT * FROM players WHERE is_banned = 0 ORDER BY last_updated DESC LIMIT 5',
        totalAchievements: 'SELECT SUM(achievements_unlocked) as total FROM players',
        totalEnemiesKilled: 'SELECT SUM(total_enemies_killed) as total FROM players',
        totalBombsUsed: 'SELECT SUM(total_bombs_used) as total FROM players'
    };
    
    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.keys(queries).forEach(key => {
        db.get(queries[key], [], (err, row) => {
            if (err) {
                console.error(`Error in query ${key}:`, err);
            } else {
                results[key] = row;
            }
            completed++;
            
            if (completed === totalQueries) {
                res.json(results);
            }
        });
    });
});

// Get player sessions
app.get('/api/players/:walletAddress/sessions', (req, res) => {
    const walletAddress = req.params.walletAddress;
    const { limit = 10 } = req.query;
    
    const query = `
        SELECT * FROM game_sessions 
        WHERE wallet_address = ? AND is_valid = 1
        ORDER BY session_start DESC 
        LIMIT ?
    `;
    
    db.all(query, [walletAddress, limit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Health check with detailed status
app.get('/api/health', (req, res) => {
    db.get('SELECT COUNT(*) as player_count FROM players', [], (err, result) => {
        if (err) {
            res.status(500).json({ 
                status: 'unhealthy', 
                timestamp: new Date().toISOString(),
                database: 'error',
                error: err.message
            });
            return;
        }
        
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            database: 'connected',
            player_count: result.player_count,
            uptime: process.uptime()
        });
    });
});

// Background task to complete expired recharges
function completeExpiredRecharges() {
    const now = new Date().toISOString();
    const query = `
        UPDATE recharge_tracking 
        SET lives_remaining = 3, 
            is_recharging = 0, 
            recharge_cooldown_end = NULL,
            last_recharge_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE is_recharging = 1 
        AND recharge_cooldown_end IS NOT NULL 
        AND recharge_cooldown_end <= ?
    `;
    
    db.run(query, [now], function(err) {
        if (err) {
            console.error('❌ Error completing expired recharges:', err);
        } else if (this.changes > 0) {
            console.log(`✅ Completed ${this.changes} expired recharges`);
        }
    });
}

// Start server with enhanced logging
app.listen(PORT, () => {
    console.log(`🚀 Enhanced Kaboom Server running on port ${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
    console.log(`🔍 Simple Admin Panel: http://localhost:${PORT}/admin-panel.html`);
    console.log(`🎯 Game: http://localhost:${PORT}/`);
    console.log(`📈 Analytics: http://localhost:${PORT}/api/analytics/dashboard`);
    console.log(`🏆 Leaderboards: http://localhost:${PORT}/api/leaderboards/score`);
    console.log(`⚡ Health Check: http://localhost:${PORT}/api/health`);
    
    // Complete any expired recharges on server start
    completeExpiredRecharges();
    
    // Check for expired recharges every 5 minutes
    setInterval(completeExpiredRecharges, 5 * 60 * 1000);
});

// Graceful shutdown with enhanced cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down enhanced server...');
    
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        console.log('👋 Enhanced server shutdown complete');
        process.exit(0);
    });
});

module.exports = app;

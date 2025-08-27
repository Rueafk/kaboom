const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Import blockchain services
const BlockchainDataManager = require('./web3/blockchain-data-manager');

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced middleware with security
const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://kaboom-game.koyeb.app', 'https://kaboom-game-rueafk.koyeb.app', 'https://favourable-elicia-afk-a1f42961.koyeb.app', 'https://*.koyeb.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8000', 'http://127.0.0.1:8000', 'null', 'file://'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('🔗 CORS: Allowing request with no origin');
            return callback(null, true);
        }
        
        console.log(`🔗 CORS: Checking origin: ${origin}`);
        console.log(`🔗 CORS: Allowed origins: ${JSON.stringify(allowedOrigins)}`);
        
        // In production, allow all koyeb.app subdomains
        if (NODE_ENV === 'production' && origin.includes('koyeb.app')) {
            console.log(`🔗 CORS: Production - allowing koyeb.app origin: ${origin}`);
            callback(null, true);
        } else if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`🔗 CORS: Origin ${origin} is allowed`);
            callback(null, true);
        } else {
            console.log(`🔗 CORS: Origin ${origin} is NOT allowed`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Admin dashboard route - must come BEFORE static file serving
app.get('/admin', (req, res) => {
    // Set permissive CSP for admin dashboard to allow wallet connections
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:;");
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Blockchain admin dashboard route
app.get('/blockchain-admin', (req, res) => {
    // Set permissive CSP for blockchain admin to allow wallet connections
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' https: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:;");
    res.sendFile(path.join(__dirname, 'blockchain-admin.html'));
});

app.use(express.static('.'));

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Initialize SQLite database
let db = null;
let dbInitialized = false;

// Initialize blockchain data manager
let blockchainManager = null;
let blockchainInitialized = false;

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Use production database in production environment
        const dbPath = NODE_ENV === 'production' ? './kaboom_game_production.db' : './kaboom_game.db';
        console.log(`🗄️ Using database: ${dbPath} (${NODE_ENV} environment)`);
        
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Database connection failed:', err.message);
                reject(err);
                return;
            }
            
            console.log('✅ SQLite database connected');
            
            // Create tables
            db.serialize(() => {
                // Players table
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
                
                // Game sessions table
                db.run(`CREATE TABLE IF NOT EXISTS game_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    session_id TEXT UNIQUE NOT NULL,
                    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_end DATETIME,
                    final_score INTEGER DEFAULT 0,
                    enemies_killed INTEGER DEFAULT 0,
                    bombs_used INTEGER DEFAULT 0,
                    is_valid BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);
                
                // Recharge tracking table
                db.run(`CREATE TABLE IF NOT EXISTS recharge_tracking (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT UNIQUE NOT NULL,
                    lives_remaining INTEGER DEFAULT 3,
                    is_recharging BOOLEAN DEFAULT 0,
                    recharge_cooldown_end DATETIME,
                    total_recharges INTEGER DEFAULT 0,
                    last_recharge_time DATETIME,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);
                
                console.log('✅ Database tables created');
                dbInitialized = true;
                resolve(true);
            });
        });
    });
}

// Initialize blockchain manager
async function initializeBlockchain() {
    try {
        blockchainManager = new BlockchainDataManager();
        blockchainInitialized = true;
        console.log('✅ Blockchain manager initialized');
        return true;
    } catch (error) {
        console.error('❌ Blockchain manager initialization failed:', error);
        blockchainInitialized = false;
        return false;
    }
}

// Initialize database and blockchain on startup
Promise.all([
    initializeDatabase().catch(err => {
        console.error('❌ Database initialization failed:', err);
        dbInitialized = false;
        return false;
    }),
    initializeBlockchain().catch(err => {
        console.error('❌ Blockchain initialization failed:', err);
        blockchainInitialized = false;
        return false;
    })
]).then(([dbSuccess, blockchainSuccess]) => {
    console.log('🚀 All services initialized');
    console.log(`📊 Database: ${dbSuccess ? '✅' : '❌'}, Blockchain: ${blockchainSuccess ? '✅' : '❌'}`);
});

// Enhanced API endpoints with SQLite

// Get all players with pagination and search
app.get('/api/players', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            players: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 0
            },
            message: 'Database not available'
        });
    }
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        
        const offset = (page - 1) * limit;
        
        let query = `SELECT * FROM players WHERE 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM players WHERE 1=1`;
        let params = [];
        
        if (search) {
            query += ` AND (username LIKE ? OR wallet_address LIKE ?)`;
            countQuery += ` AND (username LIKE ? OR wallet_address LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY total_score DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('❌ Error fetching players:', err);
                return res.status(500).json({ error: err.message });
            }
            
            db.get(countQuery, search ? [`%${search}%`, `%${search}%`] : [], (err, countResult) => {
                if (err) {
                    console.error('❌ Error counting players:', err);
                    return res.status(500).json({ error: err.message });
                }
                
                const total = countResult.total;
                const pages = Math.ceil(total / limit);
                
                res.json({
                    players: rows,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages
                    }
                });
            });
        });
    } catch (error) {
        console.error('❌ Error in players endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save player data
app.post('/api/players', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            success: true,
            message: 'Player data saved successfully (fallback mode)',
            id: Date.now()
        });
    }
    
    try {
        const playerData = req.body;
        
        if (!playerData.wallet_address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        
        const query = `
            INSERT OR REPLACE INTO players (
                wallet_address, username, level, total_score, boom_tokens, lives,
                current_score, experience_points, achievements_unlocked,
                total_playtime_minutes, games_played, games_won,
                highest_level_reached, longest_survival_time,
                total_enemies_killed, total_bombs_used, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        const params = [
            playerData.wallet_address,
            playerData.username || 'Player',
            playerData.level || 1,
            playerData.total_score || 0,
            playerData.boom_tokens || 0,
            playerData.lives || 3,
            playerData.current_score || 0,
            playerData.experience_points || 0,
            playerData.achievements_unlocked || 0,
            playerData.total_playtime_minutes || 0,
            playerData.games_played || 0,
            playerData.games_won || 0,
            playerData.highest_level_reached || 1,
            playerData.longest_survival_time || 0,
            playerData.total_enemies_killed || 0,
            playerData.total_bombs_used || 0
        ];
        
        db.run(query, params, async function(err) {
            if (err) {
                console.error('❌ Error saving player:', err);
                return res.status(500).json({ error: err.message });
            }
            
            // Also store on blockchain if available
            let blockchainResult = null;
            if (blockchainInitialized && blockchainManager) {
                try {
                    blockchainResult = await blockchainManager.storePlayerProfile(playerData);
                    console.log('🔗 Player data also stored on blockchain:', blockchainResult);
                } catch (blockchainError) {
                    console.error('❌ Error storing on blockchain:', blockchainError);
                    blockchainResult = { error: blockchainError.message };
                }
            }
            
            res.json({
                success: true,
                message: 'Player data saved successfully',
                id: this.lastID,
                blockchain: blockchainResult
            });
        });
    } catch (error) {
        console.error('❌ Error in save player endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get player by wallet address
app.get('/api/players/:walletAddress', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            wallet_address: req.params.walletAddress,
            username: 'Player',
            level: 1,
            total_score: 0,
            boom_tokens: 0,
            lives: 3,
            message: 'Database not available'
        });
    }
    
    try {
        const walletAddress = req.params.walletAddress;
        
        db.get('SELECT * FROM players WHERE wallet_address = ?', [walletAddress], (err, row) => {
            if (err) {
                console.error('❌ Error fetching player:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (!row) {
                return res.status(404).json({ error: 'Player not found' });
            }
            
            res.json(row);
        });
    } catch (error) {
        console.error('❌ Error in get player endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start game session
app.post('/api/sessions/start', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            success: true,
            session_id: req.body.session_id || Date.now().toString(),
            message: 'Game session started (fallback mode)'
        });
    }
    
    try {
        const { wallet_address, session_id } = req.body;
        
        if (!wallet_address || !session_id) {
            return res.status(400).json({ error: 'Wallet address and session ID are required' });
        }
        
        const query = `INSERT INTO game_sessions (wallet_address, session_id) VALUES (?, ?)`;
        
        db.run(query, [wallet_address, session_id], function(err) {
            if (err) {
                console.error('❌ Error starting session:', err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                success: true,
                session_id: session_id,
                message: 'Game session started'
            });
        });
    } catch (error) {
        console.error('❌ Error in start session endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// End game session
app.post('/api/sessions/end', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            success: true,
            message: 'Game session ended (fallback mode)',
            session: { session_id: req.body.session_id }
        });
    }
    
    try {
        const { wallet_address, session_id, final_score, enemies_killed, bombs_used } = req.body;
        
        if (!wallet_address || !session_id) {
            return res.status(400).json({ error: 'Wallet address and session ID are required' });
        }
        
        const query = `
            UPDATE game_sessions 
            SET session_end = CURRENT_TIMESTAMP,
                final_score = ?,
                enemies_killed = ?,
                bombs_used = ?
            WHERE session_id = ? AND wallet_address = ?
        `;
        
        db.run(query, [final_score || 0, enemies_killed || 0, bombs_used || 0, session_id, wallet_address], async function(err) {
            if (err) {
                console.error('❌ Error ending session:', err);
                return res.status(500).json({ error: err.message });
            }
            
            // Also store on blockchain if available
            let blockchainResult = null;
            if (blockchainInitialized && blockchainManager) {
                try {
                    const sessionData = {
                        session_id: session_id,
                        wallet_address: wallet_address,
                        session_end: new Date().toISOString(),
                        final_score: final_score || 0,
                        enemies_killed: enemies_killed || 0,
                        bombs_used: bombs_used || 0
                    };
                    blockchainResult = await blockchainManager.storeGameSession(sessionData);
                    console.log('🔗 Game session also stored on blockchain:', blockchainResult);
                } catch (blockchainError) {
                    console.error('❌ Error storing session on blockchain:', blockchainError);
                    blockchainResult = { error: blockchainError.message };
                }
            }
            
            res.json({
                success: true,
                message: 'Game session ended',
                session: { session_id: session_id },
                blockchain: blockchainResult
            });
        });
    } catch (error) {
        console.error('❌ Error in end session endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get player sessions
app.get('/api/players/:walletAddress/sessions', async (req, res) => {
    if (!dbInitialized) {
        return res.json([]);
    }
    
    try {
        const walletAddress = req.params.walletAddress;
        const limit = parseInt(req.query.limit) || 10;
        
        const query = `
            SELECT * FROM game_sessions 
            WHERE wallet_address = ? AND is_valid = 1
            ORDER BY session_start DESC 
            LIMIT ?
        `;
        
        db.all(query, [walletAddress, limit], (err, rows) => {
            if (err) {
                console.error('❌ Error fetching sessions:', err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json(rows);
        });
    } catch (error) {
        console.error('❌ Error in sessions endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Recharge system endpoints
app.get('/api/recharge/:walletAddress', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            wallet_address: req.params.walletAddress,
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
    
    try {
        const walletAddress = req.params.walletAddress;
        
        db.get('SELECT * FROM recharge_tracking WHERE wallet_address = ?', [walletAddress], (err, row) => {
            if (err) {
                console.error('❌ Error fetching recharge status:', err);
                return res.status(500).json({ error: err.message });
            }
            
            if (row) {
                const now = new Date();
                const cooldownEnd = row.recharge_cooldown_end ? new Date(row.recharge_cooldown_end) : null;
                const isRecharging = cooldownEnd && now < cooldownEnd;
                const timeRemaining = isRecharging ? Math.max(0, cooldownEnd - now) : 0;
                
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
    } catch (error) {
        console.error('❌ Error in recharge endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/recharge/start/:walletAddress', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            success: true,
            wallet_address: req.params.walletAddress,
            recharge_cooldown_end: new Date(Date.now() + (45 * 60 * 1000)).toISOString(),
            time_remaining_ms: 45 * 60 * 1000,
            time_remaining_minutes: 45,
            lives_remaining: 0,
            is_recharging: true
        });
    }
    
    try {
        const walletAddress = req.params.walletAddress;
        const cooldownMinutes = 45;
        const cooldownEnd = new Date(Date.now() + (cooldownMinutes * 60 * 1000));
        
        const query = `
            INSERT OR REPLACE INTO recharge_tracking 
            (wallet_address, lives_remaining, recharge_cooldown_end, is_recharging, updated_at)
            VALUES (?, 0, ?, 1, CURRENT_TIMESTAMP)
        `;
        
        db.run(query, [walletAddress, cooldownEnd.toISOString()], function(err) {
            if (err) {
                console.error('❌ Error starting recharge:', err);
                return res.status(500).json({ error: err.message });
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
    } catch (error) {
        console.error('❌ Error in start recharge endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/recharge/lives/:walletAddress', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            success: true,
            wallet_address: req.params.walletAddress,
            lives_remaining: req.body.lives_remaining || 3
        });
    }
    
    try {
        const walletAddress = req.params.walletAddress;
        const { lives_remaining } = req.body;
        
        if (lives_remaining === undefined || lives_remaining === null) {
            return res.status(400).json({ error: 'lives_remaining is required' });
        }
        
        if (lives_remaining < 0 || lives_remaining > 3) {
            return res.status(400).json({ error: 'Invalid lives count' });
        }
        
        const query = `
            INSERT OR REPLACE INTO recharge_tracking 
            (wallet_address, lives_remaining, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `;
        
        db.run(query, [walletAddress, lives_remaining], function(err) {
            if (err) {
                console.error('❌ Error updating lives:', err);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                success: true,
                wallet_address: walletAddress,
                lives_remaining: lives_remaining
            });
        });
    } catch (error) {
        console.error('❌ Error in update lives endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Blockchain endpoints
app.get('/api/blockchain/status', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.json({
                status: 'unavailable',
                message: 'Blockchain service not initialized'
            });
        }
        
        const status = await blockchainManager.getBlockchainStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/blockchain/player-profile', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        const playerData = req.body;
        const result = await blockchainManager.storePlayerProfile(playerData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/blockchain/game-session', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        const sessionData = req.body;
        const result = await blockchainManager.storeGameSession(sessionData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/blockchain/award-tokens', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        const { wallet_address, amount, reason } = req.body;
        const result = await blockchainManager.awardBoomTokens(wallet_address, amount, reason);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/blockchain/token-balance/:walletAddress', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        const walletAddress = req.params.walletAddress;
        const result = await blockchainManager.getBoomTokenBalance(walletAddress);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/blockchain/achievement', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        const achievementData = req.body;
        const result = await blockchainManager.storeAchievement(achievementData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/blockchain/sync-queue', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        const status = blockchainManager.getSyncQueueStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/blockchain/force-sync', async (req, res) => {
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        await blockchainManager.forceProcessQueue();
        res.json({ success: true, message: 'Sync queue processed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enable blockchain storage
app.post('/api/blockchain/enable', async (req, res) => {
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log('🔗 Enable blockchain request received');
        console.log('📊 Blockchain initialized:', blockchainInitialized);
        console.log('📊 Blockchain manager:', blockchainManager ? 'exists' : 'null');
        
        if (!blockchainInitialized || !blockchainManager) {
            console.log('❌ Blockchain service not available');
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        blockchainManager.setEnabled(true);
        console.log('✅ Blockchain storage enabled via admin dashboard');
        res.json({ success: true, message: 'Blockchain storage enabled' });
    } catch (error) {
        console.error('❌ Error enabling blockchain:', error);
        res.status(500).json({ error: error.message });
    }
});

// Disable blockchain storage
app.post('/api/blockchain/disable', async (req, res) => {
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log('🔗 Disable blockchain request received');
        console.log('📊 Blockchain initialized:', blockchainInitialized);
        console.log('📊 Blockchain manager:', blockchainManager ? 'exists' : 'null');
        
        if (!blockchainInitialized || !blockchainManager) {
            console.log('❌ Blockchain service not available');
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        blockchainManager.setEnabled(false);
        console.log('⚠️ Blockchain storage disabled via admin dashboard');
        res.json({ success: true, message: 'Blockchain storage disabled' });
    } catch (error) {
        console.error('❌ Error disabling blockchain:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear sync queue
app.post('/api/blockchain/clear-queue', async (req, res) => {
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        if (!blockchainInitialized || !blockchainManager) {
            return res.status(503).json({ error: 'Blockchain service not available' });
        }
        
        blockchainManager.clearSyncQueue();
        res.json({ success: true, message: 'Sync queue cleared' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simple health check for deployment
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: PORT,
        database: dbInitialized ? 'connected' : 'fallback_mode',
        blockchain: blockchainInitialized ? 'connected' : 'fallback_mode'
    });
});

// Detailed health check with database
app.get('/api/health/detailed', async (req, res) => {
    try {
        if (!dbInitialized) {
            return res.json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: 'not_connected',
                error: 'Database not initialized'
            });
        }
        
        // Test database connection
        db.get('SELECT COUNT(*) as count FROM players', (err, row) => {
            if (err) {
                return res.json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    database: 'error',
                    error: err.message
                });
            }
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                player_count: row.count,
                uptime: process.uptime()
            });
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            timestamp: new Date().toISOString(),
            database: 'error',
            error: error.message
        });
    }
});

// Background task to complete expired recharges
function completeExpiredRecharges() {
    if (!dbInitialized) return;
    
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
const server = app.listen(PORT, () => {
    console.log(`🚀 Enhanced Kaboom Server running on port ${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🎯 Game: http://localhost:${PORT}/`);
    console.log(`⚡ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test Endpoint: http://localhost:${PORT}/test`);
    
    // Complete any expired recharges on server start
    completeExpiredRecharges();
    
    // Check for expired recharges every 5 minutes
    setInterval(completeExpiredRecharges, 5 * 60 * 1000);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Graceful shutdown with enhanced cleanup
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down enhanced server...');
    
    try {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database closed');
                }
            });
        }
    } catch (error) {
        console.error('❌ Error closing database connections:', error.message);
    }
    
    console.log('👋 Enhanced server shutdown complete');
    process.exit(0);
});

module.exports = app;

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import blockchain services
const BlockchainDataManager = require('./web3/blockchain-data-manager');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:8000", "https://*.koyeb.app"],
        methods: ["GET", "POST"]
    }
});
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
        
        // In production, allow all koyeb.app subdomains
        if (NODE_ENV === 'production' && origin.includes('koyeb.app')) {
            console.log(`🔗 CORS: Production - allowing koyeb.app origin: ${origin}`);
            return callback(null, true);
        }
        
        // Check against allowed origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`🔗 CORS: Origin ${origin} is allowed`);
            return callback(null, true);
        }
        
        console.log(`🔗 CORS: Origin ${origin} is NOT allowed`);
        console.log(`🔗 CORS: Allowed origins: ${JSON.stringify(allowedOrigins)}`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Route-level CORS: always allow same-origin and deployed domains for blockchain APIs
// This bypasses overly strict global CORS checks for these control endpoints
app.use('/api/blockchain', cors({ origin: true, credentials: true }));
app.options('/api/blockchain/*', cors({ origin: true, credentials: true }));

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

// Serve static files with proper error handling
app.use(express.static('.', {
    setHeaders: (res, path) => {
        // Set proper MIME types for common file types
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.woff2') || path.endsWith('.woff')) {
            res.setHeader('Content-Type', 'font/woff2');
        }
    },
    fallthrough: false // Don't fall through to next middleware if file not found
}));

// Handle missing assets gracefully
app.get('*.woff2', (req, res) => {
    console.log(`Font file requested but not found: ${req.path}`);
    res.status(404).send('Font not found');
});

app.get('*.woff', (req, res) => {
    console.log(`Font file requested but not found: ${req.path}`);
    res.status(404).send('Font not found');
});

// Handle missing JavaScript assets
app.get('*.js', (req, res, next) => {
    if (req.path.includes('browser-ponyfill') || req.path.includes('utils-C-QmA_tl')) {
        console.log(`JavaScript file requested but not found: ${req.path}`);
        return res.status(404).send('Script not found');
    }
    next();
});

// Handle 404 for static files gracefully
app.use((req, res, next) => {
    if (req.path.includes('.') && !req.path.startsWith('/api')) {
        // This is a static file request that wasn't found
        console.log(`404: Static file not found: ${req.path}`);
        return res.status(404).send('File not found');
    }
    next();
});

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Enhanced health check endpoint for Koyeb
app.get('/api/healthz', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        port: PORT,
        database: dbInitialized ? 'Connected' : 'Not Connected',
        blockchain: blockchainInitialized ? 'Connected' : 'Not Connected'
    };
    
    res.status(200).json(health);
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
                
                // Initialize with real player data if database is empty
                initializeRealPlayerData().then(() => {
                    dbInitialized = true;
                    resolve(true);
                }).catch(err => {
                    console.error('❌ Error initializing real player data:', err);
                    dbInitialized = true;
                    resolve(true); // Continue even if initialization fails
                });
            });
        });
    });
}

// Initialize real player data if database is empty
async function initializeRealPlayerData() {
    return new Promise((resolve, reject) => {
        // Check if database is empty
        db.get('SELECT COUNT(*) as count FROM players', (err, row) => {
            if (err) {
                console.error('❌ Error checking player count:', err);
                reject(err);
                return;
            }
            
            if (row.count > 0) {
                console.log(`📊 Database already has ${row.count} players, skipping initialization`);
                resolve();
                return;
            }
            
            console.log('📊 Database is empty, initializing with real player data...');
            
            // Real player data from the original database
            const realPlayers = [
                {
                    wallet_address: '5u4iU6mN2fWKbD8pCNizvtdFYSSxubcgKZh5Szf5ziKv',
                    username: 'Kaboom_5u4iU6',
                    level: 1,
                    total_score: 55900,
                    boom_tokens: 5590,
                    lives: 3,
                    current_score: 0,
                    experience_points: 0,
                    achievements_unlocked: 0,
                    total_playtime_minutes: 0,
                    games_played: 0,
                    games_won: 0,
                    highest_level_reached: 1,
                    longest_survival_time: 0,
                    total_enemies_killed: 0,
                    total_bombs_used: 0
                },
                {
                    wallet_address: '7hFiL6Y38Tki9nynsLZSzqMMABJ9phKxZBXYeshZiz8h',
                    username: 'Kaboom_7hFiL6',
                    level: 1,
                    total_score: 2700,
                    boom_tokens: 270,
                    lives: 3,
                    current_score: 0,
                    experience_points: 0,
                    achievements_unlocked: 0,
                    total_playtime_minutes: 0,
                    games_played: 0,
                    games_won: 0,
                    highest_level_reached: 1,
                    longest_survival_time: 0,
                    total_enemies_killed: 0,
                    total_bombs_used: 0
                },
                {
                    wallet_address: '6vQ3yxe3a6aTdKce89wLZBgKgLAtahw5VWdQRG8bDvqg',
                    username: 'Kaboom_6vQ3yx',
                    level: 1,
                    total_score: 0,
                    boom_tokens: 0,
                    lives: 3,
                    current_score: 0,
                    experience_points: 0,
                    achievements_unlocked: 0,
                    total_playtime_minutes: 0,
                    games_played: 0,
                    games_won: 0,
                    highest_level_reached: 1,
                    longest_survival_time: 0,
                    total_enemies_killed: 0,
                    total_bombs_used: 0
                },
                {
                    wallet_address: '6M7kt5t235PneqWNFfpS2CA2UAy7KUndZ5dn2MwUJwdS',
                    username: 'Kaboom_6M7kt5',
                    level: 4,
                    total_score: 5400,
                    boom_tokens: 540,
                    lives: 1,
                    current_score: 5400,
                    experience_points: 0,
                    achievements_unlocked: 0,
                    total_playtime_minutes: 0,
                    games_played: 0,
                    games_won: 0,
                    highest_level_reached: 4,
                    longest_survival_time: 0,
                    total_enemies_killed: 0,
                    total_bombs_used: 0
                }
            ];
            
            // Insert real players
            let insertedCount = 0;
            realPlayers.forEach((player, index) => {
                const query = `
                    INSERT INTO players (
                        wallet_address, username, level, total_score, boom_tokens, lives,
                        current_score, experience_points, achievements_unlocked,
                        total_playtime_minutes, games_played, games_won,
                        highest_level_reached, longest_survival_time,
                        total_enemies_killed, total_bombs_used
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const params = [
                    player.wallet_address,
                    player.username,
                    player.level,
                    player.total_score,
                    player.boom_tokens,
                    player.lives,
                    player.current_score,
                    player.experience_points,
                    player.achievements_unlocked,
                    player.total_playtime_minutes,
                    player.games_played,
                    player.games_won,
                    player.highest_level_reached,
                    player.longest_survival_time,
                    player.total_enemies_killed,
                    player.total_bombs_used
                ];
                
                db.run(query, params, function(err) {
                    if (err) {
                        console.error(`❌ Error inserting player ${player.username}:`, err);
                    } else {
                        insertedCount++;
                        console.log(`✅ Inserted player: ${player.username} (${player.wallet_address.substring(0, 8)}...)`);
                    }
                    
                    // Check if all players have been processed
                    if (insertedCount === realPlayers.length) {
                        console.log(`🎉 Successfully initialized database with ${insertedCount} real players`);
                        resolve();
                    }
                });
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
    
    // Force enable blockchain in production to bypass CORS issues
    if (blockchainSuccess && blockchainManager && NODE_ENV === 'production') {
        blockchainManager.setEnabled(true);
        console.log('🔗 Blockchain force-enabled for production');
    }
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
    console.log('📝 Save player request received:', req.body);
    
    if (!dbInitialized) {
        console.log('⚠️ Database not initialized, returning fallback response');
        return res.json({
            success: true,
            message: 'Player data saved successfully (fallback mode)',
            id: Date.now()
        });
    }
    
    try {
        const playerData = req.body;
        
        if (!playerData.wallet_address) {
            console.log('❌ Missing wallet address in request');
            return res.status(400).json({ error: 'Wallet address is required' });
        }
        
        console.log(`💾 Saving player data for wallet: ${playerData.wallet_address}`);
        
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
            
            console.log(`✅ Player data saved to database. ID: ${this.lastID}, Wallet: ${playerData.wallet_address}`);
            
            // Also store on blockchain if available
            let blockchainResult = null;
            if (blockchainInitialized && blockchainManager) {
                try {
                    console.log('🔗 Attempting to store on blockchain...');
                    blockchainResult = await blockchainManager.storePlayerProfile(playerData);
                    console.log('🔗 Player data also stored on blockchain:', blockchainResult);
                } catch (blockchainError) {
                    console.error('❌ Error storing on blockchain:', blockchainError);
                    blockchainResult = { error: blockchainError.message };
                }
            } else {
                console.log('⚠️ Blockchain not available for storage');
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
    console.log('🎮 Start session request received:', req.body);
    
    if (!dbInitialized) {
        console.log('⚠️ Database not initialized, returning fallback response');
        return res.json({
            success: true,
            session_id: req.body.session_id || Date.now().toString(),
            message: 'Game session started (fallback mode)'
        });
    }
    
    try {
        const { wallet_address, session_id } = req.body;
        
        if (!wallet_address || !session_id) {
            console.log('❌ Missing wallet address or session ID in request');
            return res.status(400).json({ error: 'Wallet address and session ID are required' });
        }
        
        console.log(`🎮 Starting session for wallet: ${wallet_address}, Session ID: ${session_id}`);
        
        const query = `INSERT INTO game_sessions (wallet_address, session_id) VALUES (?, ?)`;
        
        db.run(query, [wallet_address, session_id], function(err) {
            if (err) {
                console.error('❌ Error starting session:', err);
                return res.status(500).json({ error: err.message });
            }
            
            console.log(`✅ Session started successfully. ID: ${this.lastID}, Wallet: ${wallet_address}`);
            
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

// Health check for Koyeb
app.get('/api/healthz', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Admin authentication
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple admin credentials (in production, use environment variables)
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'kaboom2024';
        
        if (username === adminUsername && password === adminPassword) {
            // Generate a simple JWT-like token (in production, use proper JWT)
            const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
            
            res.json({
                success: true,
                token: token,
                message: 'Login successful'
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit score endpoint
app.post('/api/submit-score', async (req, res) => {
    console.log('📊 Submit score request received:', req.body);
    
    if (!dbInitialized) {
        console.log('⚠️ Database not initialized, returning fallback response');
        return res.json({
            success: true,
            message: 'Score submitted successfully (fallback mode)',
            id: Date.now()
        });
    }
    
    try {
        const { wallet, score, tokens, matchId, clientSig, metadata } = req.body;
        
        if (!wallet || score === undefined) {
            console.log('❌ Missing wallet or score in request');
            return res.status(400).json({ error: 'Wallet and score are required' });
        }
        
        console.log(`💾 Submitting score for wallet: ${wallet}, Score: ${score}, Tokens: ${tokens}`);
        
        // Update player's total score and tokens
        const updateQuery = `
            UPDATE players 
            SET total_score = total_score + ?,
                boom_tokens = boom_tokens + ?,
                current_score = ?,
                games_played = games_played + 1,
                last_updated = CURRENT_TIMESTAMP,
                last_active_at = CURRENT_TIMESTAMP
            WHERE wallet_address = ?
        `;
        
        db.run(updateQuery, [score, tokens || 0, score, wallet], async function(err) {
            if (err) {
                console.error('❌ Error updating player score:', err);
                return res.status(500).json({ error: err.message });
            }
            
            console.log(`✅ Score updated for wallet: ${wallet}`);
            
            // Emit real-time update to admin dashboard
            emitAdminUpdate('new_score', {
                wallet: wallet,
                score: score,
                tokens: tokens || 0,
                matchId: matchId
            });
            
            // Also store on blockchain if available
            let blockchainResult = null;
            if (blockchainInitialized && blockchainManager) {
                try {
                    console.log('🔗 Attempting to store score on blockchain...');
                    const scoreData = {
                        wallet_address: wallet,
                        score: score,
                        tokens: tokens || 0,
                        match_id: matchId,
                        metadata: metadata
                    };
                    blockchainResult = await blockchainManager.storeScore(scoreData);
                    console.log('🔗 Score also stored on blockchain:', blockchainResult);
                } catch (blockchainError) {
                    console.error('❌ Error storing score on blockchain:', blockchainError);
                    blockchainResult = { error: blockchainError.message };
                }
            }
            
            res.json({
                success: true,
                message: 'Score submitted successfully',
                score: score,
                tokens: tokens || 0,
                blockchain: blockchainResult
            });
        });
    } catch (error) {
        console.error('❌ Error in submit score endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin dashboard stats
app.get('/api/admin/stats', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            totalPlayers: 0,
            activePlayers24h: 0,
            totalScore: 0,
            totalTokens: 0,
            gamesPlayedToday: 0,
            averageScore: 0
        });
    }
    
    try {
        // Get total players
        db.get('SELECT COUNT(*) as total FROM players', (err, totalRow) => {
            if (err) {
                console.error('❌ Error getting total players:', err);
                return res.status(500).json({ error: err.message });
            }
            
            // Get active players in last 24h
            const activeQuery = `
                SELECT COUNT(*) as active 
                FROM players 
                WHERE last_active_at >= datetime('now', '-1 day')
            `;
            
            db.get(activeQuery, (err, activeRow) => {
                if (err) {
                    console.error('❌ Error getting active players:', err);
                    return res.status(500).json({ error: err.message });
                }
                
                // Get total score and tokens
                db.get('SELECT SUM(total_score) as totalScore, SUM(boom_tokens) as totalTokens FROM players', (err, statsRow) => {
                    if (err) {
                        console.error('❌ Error getting stats:', err);
                        return res.status(500).json({ error: err.message });
                    }
                    
                    // Get games played today
                    const gamesQuery = `
                        SELECT COUNT(*) as gamesToday 
                        FROM game_sessions 
                        WHERE session_start >= date('now')
                    `;
                    
                    db.get(gamesQuery, (err, gamesRow) => {
                        if (err) {
                            console.error('❌ Error getting games today:', err);
                            return res.status(500).json({ error: err.message });
                        }
                        
                        // Calculate average score
                        const avgQuery = `
                            SELECT AVG(total_score) as avgScore 
                            FROM players 
                            WHERE total_score > 0
                        `;
                        
                        db.get(avgQuery, (err, avgRow) => {
                            if (err) {
                                console.error('❌ Error getting average score:', err);
                                return res.status(500).json({ error: err.message });
                            }
                            
                            res.json({
                                totalPlayers: totalRow.total || 0,
                                activePlayers24h: activeRow.active || 0,
                                totalScore: statsRow.totalScore || 0,
                                totalTokens: statsRow.totalTokens || 0,
                                gamesPlayedToday: gamesRow.gamesToday || 0,
                                averageScore: Math.round(avgRow.avgScore || 0)
                            });
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('❌ Error in admin stats endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin leaderboard
app.get('/api/admin/leaderboard', async (req, res) => {
    if (!dbInitialized) {
        return res.json({
            leaderboard: [],
            metric: req.query.metric || 'score',
            limit: parseInt(req.query.limit) || 50
        });
    }
    
    try {
        const metric = req.query.metric || 'score';
        const limit = parseInt(req.query.limit) || 50;
        
        let orderBy = 'total_score DESC';
        if (metric === 'tokens') {
            orderBy = 'boom_tokens DESC';
        }
        
        const query = `
            SELECT wallet_address, username, total_score, boom_tokens, games_played, last_active_at
            FROM players 
            ORDER BY ${orderBy}
            LIMIT ?
        `;
        
        db.all(query, [limit], (err, rows) => {
            if (err) {
                console.error('❌ Error getting leaderboard:', err);
                return res.status(500).json({ error: err.message });
            }
            
            const leaderboard = rows.map((row, index) => ({
                wallet: row.wallet_address,
                username: row.username,
                totalScore: row.total_score,
                boomTokens: row.boom_tokens,
                gamesPlayed: row.games_played,
                lastActiveAt: row.last_active_at,
                rank: index + 1
            }));
            
            res.json({
                leaderboard: leaderboard,
                metric: metric,
                limit: limit
            });
        });
    } catch (error) {
        console.error('❌ Error in admin leaderboard endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin events
app.get('/api/admin/events', async (req, res) => {
    if (!dbInitialized) {
        return res.json([]);
    }
    
    try {
        const wallet = req.query.wallet;
        const from = req.query.from;
        const to = req.query.to;
        const limit = parseInt(req.query.limit) || 100;
        
        let query = `
            SELECT gs.*, p.username 
            FROM game_sessions gs
            LEFT JOIN players p ON gs.wallet_address = p.wallet_address
            WHERE 1=1
        `;
        let params = [];
        
        if (wallet) {
            query += ` AND gs.wallet_address LIKE ?`;
            params.push(`%${wallet}%`);
        }
        
        if (from) {
            query += ` AND gs.session_start >= ?`;
            params.push(from);
        }
        
        if (to) {
            query += ` AND gs.session_start <= ?`;
            params.push(to);
        }
        
        query += ` ORDER BY gs.session_start DESC LIMIT ?`;
        params.push(limit);
        
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('❌ Error getting events:', err);
                return res.status(500).json({ error: err.message });
            }
            
            const events = rows.map(row => ({
                id: row.id,
                playerId: row.wallet_address,
                type: 'game_end',
                value: row.final_score,
                matchId: row.session_id,
                metadata: {
                    enemiesKilled: row.enemies_killed,
                    bombsUsed: row.bombs_used,
                    sessionDuration: row.session_end ? 
                        new Date(row.session_end) - new Date(row.session_start) : null
                },
                createdAt: row.session_start
            }));
            
            res.json(events);
        });
    } catch (error) {
        console.error('❌ Error in admin events endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Admin export CSV
app.get('/api/admin/export.csv', async (req, res) => {
    if (!dbInitialized) {
        return res.status(503).json({ error: 'Database not available' });
    }
    
    try {
        const search = req.query.search;
        const from = req.query.from;
        const to = req.query.to;
        const minScore = req.query.minScore;
        
        let query = `SELECT * FROM players WHERE 1=1`;
        let params = [];
        
        if (search) {
            query += ` AND (username LIKE ? OR wallet_address LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (from) {
            query += ` AND created_at >= ?`;
            params.push(from);
        }
        
        if (to) {
            query += ` AND created_at <= ?`;
            params.push(to);
        }
        
        if (minScore) {
            query += ` AND total_score >= ?`;
            params.push(minScore);
        }
        
        query += ` ORDER BY total_score DESC`;
        
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('❌ Error exporting data:', err);
                return res.status(500).json({ error: err.message });
            }
            
            // Convert to CSV
            const headers = [
                'Wallet', 'Username', 'Level', 'Total Score', 'Boom Tokens', 
                'Lives', 'Games Played', 'Games Won', 'Highest Level', 
                'Total Enemies Killed', 'Total Bombs Used', 'Last Active', 'Created At'
            ];
            
            const csvData = [
                headers.join(','),
                ...rows.map(row => [
                    row.wallet_address,
                    row.username || '',
                    row.level,
                    row.total_score,
                    row.boom_tokens,
                    row.lives,
                    row.games_played,
                    row.games_won,
                    row.highest_level_reached,
                    row.total_enemies_killed,
                    row.total_bombs_used,
                    row.last_active_at,
                    row.created_at
                ].join(','))
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="kaboom-players-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvData);
        });
    } catch (error) {
        console.error('❌ Error in export endpoint:', error);
        res.status(500).json({ error: error.message });
    }
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

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    // Join admin room
    socket.on('join-admin', () => {
        socket.join('admin');
        console.log('👤 Admin joined dashboard');
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Function to emit real-time updates to admin dashboard
function emitAdminUpdate(type, data) {
    io.to('admin').emit('admin-update', {
        type: type,
        data: data,
        timestamp: new Date().toISOString()
    });
}

// Start server with enhanced logging
server.listen(PORT, () => {
    console.log(`🚀 Enhanced Kaboom Server running on port ${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🎯 Game: http://localhost:${PORT}/`);
    console.log(`⚡ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test Endpoint: http://localhost:${PORT}/test`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    
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

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 8000;
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

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Initialize PostgreSQL and Redis
let dbInitialized = false;

async function initializeServer() {
    try {
        console.log('🚀 Initializing PostgreSQL and Redis...');
        dbInitialized = await database.initializeDatabase();
        
        if (dbInitialized) {
            console.log('✅ Database initialization successful');
        } else {
            console.warn('⚠️ Database initialization failed - running in fallback mode');
            dbInitialized = false;
        }
    } catch (error) {
        console.warn('⚠️ Database connection failed - running in fallback mode:', error.message);
        dbInitialized = false;
    }
}

// Initialize server on startup
initializeServer();

// Enhanced API endpoints with PostgreSQL

// Get all players with pagination and search
app.get('/api/players', async (req, res) => {
    if (!dbInitialized) {
        // Return test data for demonstration
        const testPlayers = [
            {
                id: 1,
                wallet_address: "GDywdSHFF1HB2Fnpt6fJNn4uQ2uzcr1LFQaCpMET6vSX",
                username: "TestPlayer1",
                level: 15,
                total_score: 25000,
                boom_tokens: 1500,
                lives: 3,
                current_score: 5000,
                experience_points: 750,
                games_played: 25,
                games_won: 18,
                total_enemies_killed: 450,
                total_bombs_used: 75,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                wallet_address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                username: "TestPlayer2",
                level: 8,
                total_score: 12000,
                boom_tokens: 800,
                lives: 2,
                current_score: 3000,
                experience_points: 400,
                games_played: 15,
                games_won: 10,
                total_enemies_killed: 280,
                total_bombs_used: 45,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                wallet_address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
                username: "TestPlayer3",
                level: 22,
                total_score: 35000,
                boom_tokens: 2200,
                lives: 3,
                current_score: 8000,
                experience_points: 1100,
                games_played: 35,
                games_won: 28,
                total_enemies_killed: 680,
                total_bombs_used: 120,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
            }
        ];
        
        return res.json({
            players: testPlayers,
            pagination: {
                page: 1,
                limit: 20,
                total: testPlayers.length,
                pages: 1
            },
            message: 'Demo mode - showing test data'
        });
    }
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT * FROM players 
            WHERE 1=1
        `;
        let countQuery = `SELECT COUNT(*) as total FROM players WHERE 1=1`;
        let params = [];
        
        if (search) {
            query += ` AND (username ILIKE $1 OR wallet_address ILIKE $1)`;
            countQuery += ` AND (username ILIKE $1 OR wallet_address ILIKE $1)`;
            params.push(`%${search}%`);
        }
        
        query += ` ORDER BY total_score DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const client = await database.pgPool.connect();
        
        const [result, countResult] = await Promise.all([
            client.query(query, params),
            client.query(countQuery, search ? [`%${search}%`] : [])
        ]);
        
        client.release();
        
        const total = parseInt(countResult.rows[0].total);
        const pages = Math.ceil(total / limit);
        
        res.json({
            players: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });
    } catch (error) {
        console.error('❌ Error fetching players:', error);
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
        
        const savedPlayer = await database.savePlayer(playerData);
        await database.updateLeaderboard(playerData.wallet_address, playerData.total_score || 0);
        
        res.json({
            success: true,
            message: 'Player data saved successfully',
            id: savedPlayer.id
        });
    } catch (error) {
        console.error('❌ Error saving player:', error);
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
            message: 'Database not available - running in fallback mode'
        });
    }
    
    try {
        const walletAddress = req.params.walletAddress;
        const player = await database.getPlayer(walletAddress);
        
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        
        res.json(player);
    } catch (error) {
        console.error('❌ Error fetching player:', error);
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
        
        const session = await database.createSession(wallet_address, session_id);
        
        res.json({
            success: true,
            session_id: session.session_id,
            message: 'Game session started'
        });
    } catch (error) {
        console.error('❌ Error starting session:', error);
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
        
        const session = await database.endSession(wallet_address, session_id, final_score, enemies_killed, bombs_used);
        
        res.json({
            success: true,
            message: 'Game session ended',
            session: session
        });
    } catch (error) {
        console.error('❌ Error ending session:', error);
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
        const { limit = 10 } = req.query;
        
        const query = `
            SELECT * FROM game_sessions 
            WHERE wallet_address = $1 AND is_valid = true
            ORDER BY session_start DESC 
            LIMIT $2
        `;
        
        const client = await database.pgPool.connect();
        const result = await client.query(query, [walletAddress, limit]);
        client.release();
        
        res.json(result.rows);
    } catch (error) {
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
        const query = `SELECT * FROM recharge_tracking WHERE wallet_address = $1`;
        
        const client = await database.pgPool.connect();
        const result = await client.query(query, [walletAddress]);
        client.release();
        
        if (result.rows.length > 0) {
            const row = result.rows[0];
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
    } catch (error) {
        console.error('❌ Error fetching recharge status:', error);
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
            INSERT INTO recharge_tracking 
            (wallet_address, lives_remaining, recharge_cooldown_end, is_recharging, updated_at)
            VALUES ($1, 0, $2, true, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_address) 
            DO UPDATE SET 
                lives_remaining = 0,
                recharge_cooldown_end = $2,
                is_recharging = true,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        const client = await database.pgPool.connect();
        await client.query(query, [walletAddress, cooldownEnd.toISOString()]);
        client.release();
        
        res.json({
            success: true,
            wallet_address: walletAddress,
            recharge_cooldown_end: cooldownEnd.toISOString(),
            time_remaining_ms: cooldownMinutes * 60 * 1000,
            time_remaining_minutes: cooldownMinutes,
            lives_remaining: 0,
            is_recharging: true
        });
    } catch (error) {
        console.error('❌ Error starting recharge:', error);
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
            INSERT INTO recharge_tracking 
            (wallet_address, lives_remaining, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (wallet_address) 
            DO UPDATE SET 
                lives_remaining = $2,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        const client = await database.pgPool.connect();
        await client.query(query, [walletAddress, lives_remaining]);
        client.release();
        
        res.json({
            success: true,
            wallet_address: walletAddress,
            lives_remaining: lives_remaining
        });
    } catch (error) {
        console.error('❌ Error updating lives:', error);
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
        database: dbInitialized ? 'connected' : 'fallback_mode'
    });
});

// Detailed health check with database
app.get('/api/health/detailed', async (req, res) => {
    try {
        const health = await database.healthCheck();
        const players = await database.getAllPlayers(1, 0);
        
        res.json({ 
            ...health,
            timestamp: new Date().toISOString(),
            player_count: players.length,
            uptime: process.uptime()
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
async function completeExpiredRecharges() {
    try {
        const now = new Date().toISOString();
        const query = `
            UPDATE recharge_tracking 
            SET lives_remaining = 3, 
                is_recharging = false, 
                recharge_cooldown_end = NULL,
                last_recharge_time = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE is_recharging = true 
            AND recharge_cooldown_end IS NOT NULL 
            AND recharge_cooldown_end <= $1
        `;
        
        const client = await database.pgPool.connect();
        const result = await client.query(query, [now]);
        client.release();
        
        if (result.rowCount > 0) {
            console.log(`✅ Completed ${result.rowCount} expired recharges`);
        }
    } catch (error) {
        console.error('❌ Error completing expired recharges:', error);
    }
}

// Start server with enhanced logging
const server = app.listen(PORT, () => {
    console.log(`🚀 Enhanced Kaboom Server running on port ${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
    console.log(`🔍 Simple Admin Panel: http://localhost:${PORT}/admin-panel.html`);
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
        if (database.pgPool) {
            await database.pgPool.end();
            console.log('✅ PostgreSQL pool closed');
        }
        if (database.redisClient) {
            await database.redisClient.quit();
            console.log('✅ Redis client closed');
        }
    } catch (error) {
        console.error('❌ Error closing database connections:', error.message);
    }
    
    console.log('👋 Enhanced server shutdown complete');
    process.exit(0);
});

module.exports = app;

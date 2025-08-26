const { Pool } = require('pg');
const redis = require('redis');
const sqlite3 = require('sqlite3').verbose();

// PostgreSQL Configuration with fallback
let pgPool = null;
let usePostgres = false;

try {
    pgPool = new Pool({
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'kaboom_game',
        password: process.env.POSTGRES_PASSWORD || 'password',
        port: process.env.POSTGRES_PORT || 5432,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    usePostgres = true;
    console.log('✅ PostgreSQL pool created');
} catch (error) {
    console.warn('⚠️ PostgreSQL not available, falling back to SQLite:', error.message);
    usePostgres = false;
}

// Redis Configuration with fallback
let redisClient = null;
let useRedis = false;

try {
    redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    useRedis = true;
    console.log('✅ Redis client created');
} catch (error) {
    console.warn('⚠️ Redis not available:', error.message);
    useRedis = false;
}

// SQLite fallback
let sqliteDb = null;
if (!usePostgres) {
    sqliteDb = new sqlite3.Database('./player_data.db', (err) => {
        if (err) {
            console.error('❌ SQLite fallback failed:', err.message);
        } else {
            console.log('✅ SQLite fallback connected');
        }
    });
}

// Database initialization
async function initializeDatabase() {
    try {
        // Test PostgreSQL connection
        const client = await pgPool.connect();
        console.log('✅ PostgreSQL connected successfully');
        
        // Create tables if they don't exist
        await createTables(client);
        client.release();
        
        // Test Redis connection
        await redisClient.connect();
        console.log('✅ Redis connected successfully');
        
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

// Create PostgreSQL tables
async function createTables(client) {
    const tables = [
        // Players table
        `CREATE TABLE IF NOT EXISTS players (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(100),
            level INTEGER DEFAULT 1,
            total_score BIGINT DEFAULT 0,
            boom_tokens BIGINT DEFAULT 0,
            lives INTEGER DEFAULT 3,
            current_score INTEGER DEFAULT 0,
            experience_points BIGINT DEFAULT 0,
            achievements_unlocked INTEGER DEFAULT 0,
            total_playtime_minutes INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            games_won INTEGER DEFAULT 0,
            highest_level_reached INTEGER DEFAULT 1,
            longest_survival_time INTEGER DEFAULT 0,
            total_enemies_killed INTEGER DEFAULT 0,
            total_bombs_used INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_banned BOOLEAN DEFAULT FALSE,
            ban_reason TEXT,
            cheat_score REAL DEFAULT 0.0
        )`,
        
        // Game sessions table
        `CREATE TABLE IF NOT EXISTS game_sessions (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(255) NOT NULL,
            session_id VARCHAR(255) UNIQUE NOT NULL,
            session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            session_end TIMESTAMP,
            score_earned INTEGER DEFAULT 0,
            tokens_earned INTEGER DEFAULT 0,
            enemies_killed INTEGER DEFAULT 0,
            levels_completed INTEGER DEFAULT 0,
            bombs_used INTEGER DEFAULT 0,
            survival_time_seconds INTEGER DEFAULT 0,
            level_reached INTEGER DEFAULT 1,
            session_hash VARCHAR(255),
            is_valid BOOLEAN DEFAULT TRUE
        )`,
        
        // Achievements table
        `CREATE TABLE IF NOT EXISTS achievements (
            id SERIAL PRIMARY KEY,
            achievement_id VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            token_reward INTEGER DEFAULT 0,
            xp_reward INTEGER DEFAULT 0,
            icon_url TEXT,
            is_active BOOLEAN DEFAULT TRUE
        )`,
        
        // Player achievements table
        `CREATE TABLE IF NOT EXISTS player_achievements (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(255) NOT NULL,
            achievement_id VARCHAR(100) NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(wallet_address, achievement_id)
        )`,
        
        // Recharge tracking table
        `CREATE TABLE IF NOT EXISTS recharge_tracking (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(255) UNIQUE NOT NULL,
            lives_remaining INTEGER DEFAULT 3,
            last_recharge_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            recharge_cooldown_end TIMESTAMP,
            is_recharging BOOLEAN DEFAULT FALSE,
            total_recharges INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];
    
    for (const tableQuery of tables) {
        try {
            await client.query(tableQuery);
        } catch (error) {
            console.error('Error creating table:', error);
        }
    }
    
    console.log('✅ PostgreSQL tables created/verified');
}

// Player operations
async function savePlayer(playerData) {
    if (usePostgres && pgPool) {
        // Use PostgreSQL
        const client = await pgPool.connect();
        try {
            const query = `
                INSERT INTO players (
                    wallet_address, username, level, total_score, boom_tokens, 
                    lives, current_score, experience_points, games_played, 
                    games_won, total_enemies_killed, total_bombs_used
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (wallet_address) 
                DO UPDATE SET 
                    username = EXCLUDED.username,
                    level = EXCLUDED.level,
                    total_score = EXCLUDED.total_score,
                    boom_tokens = EXCLUDED.boom_tokens,
                    lives = EXCLUDED.lives,
                    current_score = EXCLUDED.current_score,
                    experience_points = EXCLUDED.experience_points,
                    games_played = EXCLUDED.games_played,
                    games_won = EXCLUDED.games_won,
                    total_enemies_killed = EXCLUDED.total_enemies_killed,
                    total_bombs_used = EXCLUDED.total_bombs_used,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING *
            `;
            
            const values = [
                playerData.wallet_address,
                playerData.username,
                playerData.level || 1,
                playerData.total_score || 0,
                playerData.boom_tokens || 0,
                playerData.lives || 3,
                playerData.current_score || 0,
                playerData.experience_points || 0,
                playerData.games_played || 0,
                playerData.games_won || 0,
                playerData.total_enemies_killed || 0,
                playerData.total_bombs_used || 0
            ];
            
            const result = await client.query(query, values);
            
            // Update Redis cache if available
            if (useRedis && redisClient) {
                await redisClient.setEx(`player:${playerData.wallet_address}`, 3600, JSON.stringify(result.rows[0]));
            }
            
            return result.rows[0];
        } finally {
            client.release();
        }
    } else if (sqliteDb) {
        // Fallback to SQLite
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO players 
                (wallet_address, username, level, total_score, boom_tokens, lives, current_score, 
                 experience_points, games_played, games_won, total_enemies_killed, total_bombs_used, 
                 last_updated, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;
            
            const values = [
                playerData.wallet_address,
                playerData.username,
                playerData.level || 1,
                playerData.total_score || 0,
                playerData.boom_tokens || 0,
                playerData.lives || 3,
                playerData.current_score || 0,
                playerData.experience_points || 0,
                playerData.games_played || 0,
                playerData.games_won || 0,
                playerData.total_enemies_killed || 0,
                playerData.total_bombs_used || 0
            ];
            
            sqliteDb.run(query, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...playerData });
                }
            });
        });
    } else {
        throw new Error('No database available');
    }
}

async function getPlayer(walletAddress) {
    // Try Redis first
    try {
        const cached = await redisClient.get(`player:${walletAddress}`);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.warn('Redis cache miss:', error);
    }
    
    // Fallback to PostgreSQL
    const client = await pgPool.connect();
    try {
        const query = 'SELECT * FROM players WHERE wallet_address = $1';
        const result = await client.query(query, [walletAddress]);
        
        if (result.rows.length > 0) {
            // Cache the result
            await redisClient.setEx(`player:${walletAddress}`, 3600, JSON.stringify(result.rows[0]));
            return result.rows[0];
        }
        
        return null;
    } finally {
        client.release();
    }
}

async function getAllPlayers(limit = 100, offset = 0) {
    const client = await pgPool.connect();
    try {
        const query = `
            SELECT * FROM players 
            WHERE is_banned = FALSE 
            ORDER BY total_score DESC 
            LIMIT $1 OFFSET $2
        `;
        const result = await client.query(query, [limit, offset]);
        return result.rows;
    } finally {
        client.release();
    }
}

// Session operations
async function createSession(sessionData) {
    const client = await pgPool.connect();
    try {
        const query = `
            INSERT INTO game_sessions (
                wallet_address, session_id, session_start
            ) VALUES ($1, $2, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        
        const result = await client.query(query, [
            sessionData.wallet_address,
            sessionData.session_id
        ]);
        
        return result.rows[0];
    } finally {
        client.release();
    }
}

async function endSession(sessionId, sessionData) {
    const client = await pgPool.connect();
    try {
        const query = `
            UPDATE game_sessions 
            SET session_end = CURRENT_TIMESTAMP,
                score_earned = $2,
                tokens_earned = $3,
                enemies_killed = $4,
                levels_completed = $5,
                bombs_used = $6,
                survival_time_seconds = $7,
                level_reached = $8
            WHERE session_id = $1
            RETURNING *
        `;
        
        const result = await client.query(query, [
            sessionId,
            sessionData.score_earned || 0,
            sessionData.tokens_earned || 0,
            sessionData.enemies_killed || 0,
            sessionData.levels_completed || 0,
            sessionData.bombs_used || 0,
            sessionData.survival_time_seconds || 0,
            sessionData.level_reached || 1
        ]);
        
        return result.rows[0];
    } finally {
        client.release();
    }
}

// Redis operations for real-time data
async function updateLeaderboard(playerData) {
    try {
        await redisClient.zAdd('leaderboard:score', {
            score: playerData.total_score || 0,
            value: playerData.wallet_address
        });
        
        await redisClient.zAdd('leaderboard:tokens', {
            score: playerData.boom_tokens || 0,
            value: playerData.wallet_address
        });
    } catch (error) {
        console.error('Redis leaderboard update failed:', error);
    }
}

async function getLeaderboard(type = 'score', limit = 10) {
    try {
        const result = await redisClient.zRange(`leaderboard:${type}`, 0, limit - 1, { REV: true });
        return result;
    } catch (error) {
        console.error('Redis leaderboard fetch failed:', error);
        return [];
    }
}

// Health check
async function healthCheck() {
    try {
        // Test PostgreSQL
        const pgClient = await pgPool.connect();
        await pgClient.query('SELECT 1');
        pgClient.release();
        
        // Test Redis
        await redisClient.ping();
        
        return { status: 'healthy', postgresql: 'connected', redis: 'connected' };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

module.exports = {
    initializeDatabase,
    savePlayer,
    getPlayer,
    getAllPlayers,
    createSession,
    endSession,
    updateLeaderboard,
    getLeaderboard,
    healthCheck,
    pgPool,
    redisClient
};

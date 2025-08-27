// Production Configuration for Worldwide Deployment
module.exports = {
    // Production Solana Network
    SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
    
    // Production Admin Wallet (NEED TO SET IN ENVIRONMENT)
    // ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
    
    // Production Program IDs (Deploy your own programs)
    PROGRAM_IDS: {
        PLAYER_PROFILE: process.env.PLAYER_PROFILE_PROGRAM_ID || '11111111111111111111111111111111',
        GAME_SESSION: process.env.GAME_SESSION_PROGRAM_ID || '11111111111111111111111111111112',
        ACHIEVEMENT: process.env.ACHIEVEMENT_PROGRAM_ID || '11111111111111111111111111111113',
        BOOM_TOKEN: process.env.BOOM_TOKEN_MINT || '11111111111111111111111111111114'
    },
    
    // Production Server Settings
    SERVER: {
        PORT: process.env.PORT || 8000,
        NODE_ENV: 'production',
        CORS_ORIGINS: [
            'https://your-game-domain.com',
            'https://www.your-game-domain.com',
            'https://kaboom-game.koyeb.app',
            'https://kaboom-game-rueafk.koyeb.app'
        ]
    },
    
    // Database Configuration
    DATABASE: {
        PATH: './kaboom_game_production.db',
        BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
        MAX_CONNECTIONS: 10
    },
    
    // Blockchain Settings
    BLOCKCHAIN: {
        ENABLED: true,
        CONFIRMATION_LEVEL: 'confirmed',
        MAX_RETRIES: 3,
        RETRY_DELAY: 5000, // 5 seconds
        BATCH_SIZE: 10,
        SYNC_INTERVAL: 30000 // 30 seconds
    },
    
    // Security Settings
    SECURITY: {
        RATE_LIMIT: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        },
        API_KEY_REQUIRED: false,
        CORS_CREDENTIALS: true
    },
    
    // Monitoring & Analytics
    MONITORING: {
        ENABLED: true,
        LOG_LEVEL: 'info',
        METRICS_INTERVAL: 60000, // 1 minute
        ALERT_THRESHOLD: 1000 // transactions per hour
    }
};

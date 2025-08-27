class PlayerDataManager {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.isConnected = false;
        this.checkConnection();
    }
    
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            this.isConnected = response.ok;
            console.log(this.isConnected ? '✅ Database connected' : '❌ Database offline');
        } catch (error) {
            this.isConnected = false;
            console.log('❌ Database connection failed:', error.message);
        }
    }
    
    async savePlayerProfile(profile) {
        console.log('🔄 PlayerDataManager.savePlayerProfile called with:', profile);
        console.log('Database connection status:', this.isConnected);
        
        if (!this.isConnected) {
            console.warn('⚠️ Database offline; local fallback disabled');
            return { success: false, error: 'Database offline' };
        }
        
        try {
            const response = await fetch(`${this.apiBase}/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wallet_address: profile.walletAddress,
                    username: profile.username,
                    level: profile.level || 1,
                    total_score: profile.totalScore || 0,
                    boom_tokens: profile.boomTokens || 0,
                    lives: profile.lives || 3,
                    current_score: profile.currentScore || 0,
                    experience_points: profile.experiencePoints || 0,
                    achievements_unlocked: profile.achievementsUnlocked || 0,
                    games_played: profile.gamesPlayed || 0,
                    games_won: profile.gamesWon || 0,
                    highest_level_reached: profile.highestLevelReached || 1,
                    total_enemies_killed: profile.totalEnemiesKilled || 0,
                    total_bombs_used: profile.totalBombsUsed || 0
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Player data saved to database:', result);
                
                // Check if blockchain storage was successful
                if (result.blockchain && result.blockchain.success) {
                    console.log('🔗 Player data also stored on blockchain:', result.blockchain);
                } else if (result.blockchain && result.blockchain.error) {
                    console.warn('⚠️ Blockchain storage failed:', result.blockchain.error);
                }

                return { success: true, data: result };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error saving to database:', error);

            return { success: false, error: error.message };
        }
    }
    
    // REMOVED: updatePlayerProgress function - this endpoint doesn't exist in the backend
    // Use GameSessionManager for real-time data updates instead
    
    async loadPlayerProfile(walletAddress) {
        if (!this.isConnected) {
            console.warn('⚠️ Database offline; local fallback disabled');
            return null;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/players/${walletAddress}`);
            
            if (response.ok) {
                const profile = await response.json();
                console.log('✅ Player profile loaded from database:', profile);
                
                // Convert database format to game format
                return {
                    walletAddress: profile.wallet_address,
                    username: profile.username,
                    level: profile.level,
                    totalScore: profile.total_score,
                    boomTokens: profile.boom_tokens,
                    lives: profile.lives,
                    currentScore: profile.current_score,
                    gamesPlayed: profile.games_played, // map for settings UI
                    gamesWon: profile.games_won,
                    totalEnemiesKilled: profile.total_enemies_killed,
                    totalBombsUsed: profile.total_bombs_used,
                    experiencePoints: profile.experience_points,
                    lastUpdated: profile.last_updated
                };
            } else if (response.status === 404) {
                console.log('📝 Player not found in database, creating new profile');
                return null;
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading from database:', error);
            return null;
        }
    }
    
    // Local storage disabled
    saveToLocalStorage(profile) { /* no-op: disabled */ }
    
    loadFromLocalStorage(walletAddress) { return null; }
    
    async syncLocalToDatabase() { /* no-op: disabled */ }
}

// Export for use in other modules
window.PlayerDataManager = PlayerDataManager;


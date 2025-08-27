class GameSessionManager {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.currentSessionId = null;
        this.currentWallet = null;
        this.sessionStartTime = null;
        this.isConnected = false;
        this.realTimeUpdateInterval = null;
        this.lastSaveTime = 0;
        this.saveInterval = 5000; // Save every 5 seconds for more frequent updates
        this.sessionData = {
            score_earned: 0,
            tokens_earned: 0,
            enemies_killed: 0,
            levels_completed: 0,
            bombs_used: 0,
            survival_time_seconds: 0,
            level_reached: 1
        };
        
        this.checkConnection();
        console.log('🎮 GameSessionManager initialized');
    }
    
    async checkConnection() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            this.isConnected = response.ok;
            console.log(this.isConnected ? '✅ GameSessionManager: Database connected' : '❌ GameSessionManager: Database offline');
        } catch (error) {
            this.isConnected = false;
            console.log('❌ GameSessionManager: Database connection failed:', error.message);
        }
    }
    
    // Start a new game session
    async startSession(walletAddress) {
        console.log('🎮 GameSessionManager: Attempting to start session for wallet:', walletAddress);
        
        if (!this.isConnected) {
            console.warn('⚠️ GameSessionManager: Database offline, cannot start session');
            return { success: false, error: 'Database offline' };
        }
        
        try {
            // Generate a unique session ID
            const sessionId = `session_${walletAddress}_${Date.now()}`;
            
            const response = await fetch(`${this.apiBase}/sessions/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    wallet_address: walletAddress,
                    session_id: sessionId
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentSessionId = sessionId;
                this.currentWallet = walletAddress;
                this.sessionStartTime = Date.now();
                this.resetSessionData();
                
                console.log('🎮 GameSessionManager: Session started:', this.currentSessionId);
                
                // Start real-time updates
                this.startRealTimeUpdates();
                
                return { success: true, session_id: this.currentSessionId };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ GameSessionManager: Error starting session:', error);
            return { success: false, error: error.message };
        }
    }
    
    // End the current game session
    async endSession() {
        if (!this.currentSessionId || !this.isConnected) {
            console.warn('⚠️ GameSessionManager: No active session or database offline');
            return { success: false, error: 'No active session' };
        }
        
        try {
            // Calculate final session data
            this.updateSessionData();
            
            console.log('🏁 GameSessionManager: Ending session with data:', this.sessionData);
            
            // First, save the player profile with session data
            console.log('💾 GameSessionManager: Saving final player profile...');
            const saveResult = await this.savePlayerProfile();
            if (!saveResult.success) {
                console.warn('⚠️ GameSessionManager: Failed to save player profile:', saveResult.error);
            }
            
            // Then end the session
            const response = await fetch(`${this.apiBase}/sessions/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    wallet_address: this.currentWallet,
                    final_score: this.sessionData.score_earned,
                    enemies_killed: this.sessionData.enemies_killed,
                    bombs_used: this.sessionData.bombs_used,
                    level_reached: this.sessionData.level_reached,
                    survival_time: this.sessionData.survival_time_seconds
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('🏁 GameSessionManager: Session ended successfully:', result);
                
                // Check if blockchain storage was successful
                if (result.blockchain && result.blockchain.success) {
                    console.log('🔗 Game session also stored on blockchain:', result.blockchain);
                } else if (result.blockchain && result.blockchain.error) {
                    console.warn('⚠️ Blockchain storage failed:', result.blockchain.error);
                }
                
                // Stop real-time updates
                this.stopRealTimeUpdates();
                
                // Reset session data
                this.currentSessionId = null;
                this.currentWallet = null;
                this.sessionStartTime = null;
                
                return { success: true, session: result, blockchain: result.blockchain };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ GameSessionManager: Error ending session:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Save player profile with current session data
    async savePlayerProfile() {
        if (!this.currentWallet || !this.isConnected) {
            console.warn('⚠️ GameSessionManager: Cannot save profile - no wallet or database offline');
            return { success: false, error: 'No wallet or database offline' };
        }
        
        try {
            // Get current game state from window.game if available
            let currentScore = 0;
            let currentLevel = 1;
            let currentLives = 3;
            
            if (window.game && window.game.gameState) {
                currentScore = window.game.gameState.totalScore || 0;
                currentLevel = window.game.gameState.level || 1;
                currentLives = window.game.gameState.lives || 3;
            }
            
            // Calculate total tokens (10% of total score)
            const totalTokens = Math.floor(currentScore * 0.10);
            
            const playerData = {
                wallet_address: this.currentWallet,
                username: window.playerProfile?.username || `Player_${this.currentWallet.slice(0, 6)}`,
                level: currentLevel,
                total_score: currentScore,
                boom_tokens: totalTokens,
                lives: currentLives,
                current_score: this.sessionData.score_earned,
                experience_points: this.sessionData.score_earned,
                achievements_unlocked: 0,
                total_playtime_minutes: Math.floor(this.sessionData.survival_time_seconds / 60),
                games_played: 1, // Increment this
                games_won: 0,
                highest_level_reached: Math.max(currentLevel, this.sessionData.level_reached),
                longest_survival_time: this.sessionData.survival_time_seconds,
                total_enemies_killed: this.sessionData.enemies_killed,
                total_bombs_used: this.sessionData.bombs_used
            };
            
            console.log('💾 GameSessionManager: Saving profile with session data:', {
                wallet: this.currentWallet,
                score: currentScore,
                tokens: totalTokens,
                enemies: this.sessionData.enemies_killed
            });
            
            const response = await fetch(`${this.apiBase}/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(playerData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ GameSessionManager: Player profile saved with updated totals');
                
                // Update window.playerProfile if it exists
                if (window.playerProfile) {
                    window.playerProfile = { ...window.playerProfile, ...playerData };
                }
                
                // Update UI if updateSettingsData function exists
                if (typeof updateSettingsData === 'function') {
                    setTimeout(() => updateSettingsData(), 100);
                }
                
                return { success: true, result: result };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ GameSessionManager: Error saving profile:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Update session data and save immediately
    async updateSessionData() {
        if (this.sessionStartTime) {
            this.sessionData.survival_time_seconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        }
        
        // Save immediately when data changes
        await this.savePlayerProfile();
    }
    
    // Event handlers for game events
    async onEnemyKilled() {
        console.log('🔄 GameSessionManager: Updating enemy killed');
        this.sessionData.enemies_killed++;
        await this.savePlayerProfile();
        return { success: true };
    }
    
    async onScoreEarned(points) {
        console.log('🔄 GameSessionManager: Updating score earned with', points);
        this.sessionData.score_earned += points;
        await this.savePlayerProfile();
        return { success: true };
    }
    
    async onTokensEarned(tokens) {
        console.log('🔄 GameSessionManager: Updating tokens earned with', tokens);
        this.sessionData.tokens_earned += tokens;
        await this.savePlayerProfile();
        return { success: true };
    }
    
    async onBombUsed() {
        console.log('🔄 GameSessionManager: Updating bomb used');
        this.sessionData.bombs_used++;
        await this.savePlayerProfile();
        return { success: true };
    }
    
    async onPlayerDeath() {
        console.log('💀 GameSessionManager: Player death detected');
        await this.savePlayerProfile();
        return { success: true };
    }
    
    async onGameCompleted() {
        console.log('🎉 GameSessionManager: Game completed');
        await this.savePlayerProfile();
        return { success: true };
    }
    
    async onLevelComplete(levelNumber) {
        console.log(`🏆 GameSessionManager: Level ${levelNumber} completed`);
        this.sessionData.levels_completed++;
        this.sessionData.level_reached = Math.max(this.sessionData.level_reached, levelNumber);
        await this.savePlayerProfile();
        return { success: true };
    }
    
    // Force save current state
    async forceSave() {
        return await this.savePlayerProfile();
    }
    
    // Start real-time updates
    startRealTimeUpdates() {
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
        }
        
        this.realTimeUpdateInterval = setInterval(() => {
            this.updateSessionData();
        }, this.saveInterval);
        
        console.log('🔄 GameSessionManager: Real-time updates started');
    }
    
    // Stop real-time updates
    stopRealTimeUpdates() {
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
            this.realTimeUpdateInterval = null;
            console.log('⏹️ GameSessionManager: Real-time updates stopped');
        }
    }
    
    // Reset session data
    resetSessionData() {
        this.sessionData = {
            score_earned: 0,
            tokens_earned: 0,
            enemies_killed: 0,
            levels_completed: 0,
            bombs_used: 0,
            survival_time_seconds: 0,
            level_reached: 1
        };
    }
    
    // Get current session data
    getSessionData() {
        return { ...this.sessionData };
    }
    
    // Check if session is active
    isSessionActive() {
        return !!this.currentSessionId;
    }
    
    // Get current session ID
    getSessionId() {
        return this.currentSessionId;
    }
    
    // Get debug info
    getDebugInfo() {
        return {
            isConnected: this.isConnected,
            currentSessionId: this.currentSessionId,
            currentWallet: this.currentWallet,
            sessionStartTime: this.sessionStartTime,
            sessionData: this.sessionData,
            apiBase: this.apiBase
        };
    }
    
    // Log session data for debugging
    logSessionData() {
        console.log('📊 GameSessionManager Debug Info:', this.getDebugInfo());
    }
}

// Make GameSessionManager globally available
window.GameSessionManager = GameSessionManager;

// Test function for debugging
window.testGameSessionManager = function() {
    console.log('🧪 Testing GameSessionManager...');
    
    if (!window.gameSessionManager) {
        console.error('❌ GameSessionManager not found!');
        return;
    }
    
    const debugInfo = window.gameSessionManager.getDebugInfo();
    console.log('📊 Current GameSessionManager state:', debugInfo);
    
    // Test with a dummy wallet address
    const testWallet = 'test_wallet_' + Date.now();
    
    window.gameSessionManager.startSession(testWallet).then(result => {
        console.log('🎮 Test session started:', result);
        
        // Simulate some game events
        window.gameSessionManager.onEnemyKilled();
        window.gameSessionManager.onScoreEarned(100);
        window.gameSessionManager.onTokensEarned(10);
        window.gameSessionManager.onBombUsed();
        
        // Log current session data
        window.gameSessionManager.logSessionData();
        
        // End the test session
        setTimeout(() => {
            window.gameSessionManager.endSession().then(endResult => {
                console.log('🏁 Test session ended:', endResult);
            });
        }, 2000);
    });
};

// Auto-initialize GameSessionManager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Checking GameSessionManager initialization...');
    
    try {
        if (typeof GameSessionManager !== 'undefined' && !window.gameSessionManager) {
            console.log('🔧 Auto-initializing GameSessionManager...');
            window.gameSessionManager = new GameSessionManager();
            console.log('✅ GameSessionManager auto-initialized');
        } else if (window.gameSessionManager) {
            console.log('✅ GameSessionManager already initialized');
        } else {
            console.error('❌ GameSessionManager not available');
        }
    } catch (error) {
        console.error('❌ Failed to auto-initialize GameSessionManager:', error);
    }
});

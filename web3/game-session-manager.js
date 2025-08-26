class GameSessionManager {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.currentSessionId = null;
        this.currentWallet = null;
        this.sessionStartTime = null;
        this.isConnected = false;
        this.realTimeUpdateInterval = null;
        this.lastSaveTime = 0;
        this.saveInterval = 10000; // Save every 10 seconds
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
        if (!this.isConnected) {
            console.warn('⚠️ GameSessionManager: Database offline, cannot start session');
            return { success: false, error: 'Database offline' };
        }
        
        try {
            const response = await fetch(`${this.apiBase}/sessions/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ wallet_address: walletAddress })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentSessionId = result.session_id;
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
            
            const response = await fetch(`${this.apiBase}/sessions/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.currentSessionId,
                    wallet_address: this.currentWallet,
                    ...this.sessionData
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('🏁 GameSessionManager: Session ended:', result);
                
                // Stop real-time updates
                this.stopRealTimeUpdates();
                
                // Reset session
                this.currentSessionId = null;
                this.currentWallet = null;
                this.sessionStartTime = null;
                this.resetSessionData();
                
                return { success: true, data: result };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ GameSessionManager: Error ending session:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Update session data in real-time
    updateSessionData() {
        if (this.sessionStartTime) {
            this.sessionData.survival_time_seconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
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
    
    // Start real-time updates
    startRealTimeUpdates() {
        if (this.realTimeUpdateInterval) {
            clearInterval(this.realTimeUpdateInterval);
        }
        
        this.realTimeUpdateInterval = setInterval(() => {
            this.updateSessionData();
            this.savePlayerProfile();
            
            // Log session data every 30 seconds for debugging
            if (Date.now() % 30000 < this.saveInterval) {
                this.logSessionData();
            }
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
    
    // Save player profile with current session data
    async savePlayerProfile() {
        if (!this.currentWallet || !this.isConnected) {
            return { success: false, error: 'No wallet or database offline' };
        }
        
        // Prevent too frequent saves
        const now = Date.now();
        if (now - this.lastSaveTime < this.saveInterval) {
            return { success: false, error: 'Save too frequent' };
        }
        
        try {
            const response = await fetch(`${this.apiBase}/players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wallet_address: this.currentWallet,
                    username: window.playerProfile?.username || 'Player',
                    level: window.playerProfile?.level || 1,
                    total_score: window.playerProfile?.totalScore || 0,
                    boom_tokens: window.playerProfile?.boomTokens || 0,
                    lives: window.playerProfile?.lives || 3,
                    current_score: window.playerProfile?.currentScore || 0,
                    experience_points: window.playerProfile?.experiencePoints || 0,
                    games_played: window.playerProfile?.gamesPlayed || 0,
                    games_won: window.playerProfile?.gamesWon || 0,
                    total_enemies_killed: window.playerProfile?.totalEnemiesKilled || 0,
                    total_bombs_used: window.playerProfile?.totalBombsUsed || 0
                })
            });
            
            if (response.ok) {
                this.lastSaveTime = now;
                console.log('💾 GameSessionManager: Player profile saved');
                return { success: true };
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ GameSessionManager: Error saving profile:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Update session statistics
    updateSessionStats(type, value = 1) {
        switch (type) {
            case 'score':
                this.sessionData.score_earned += value;
                break;
            case 'tokens':
                this.sessionData.tokens_earned += value;
                break;
            case 'enemy_killed':
                this.sessionData.enemies_killed += value;
                break;
            case 'level_completed':
                this.sessionData.levels_completed += value;
                break;
            case 'bomb_used':
                this.sessionData.bombs_used += value;
                break;
            case 'level_reached':
                this.sessionData.level_reached = Math.max(this.sessionData.level_reached, value);
                break;
        }
        
        console.log(`📊 GameSessionManager: Updated ${type} = ${value}, Session data:`, this.sessionData);
    }
    
    // Get current session data
    getSessionData() {
        this.updateSessionData();
        return { ...this.sessionData };
    }
    
    // Check if session is active
    isSessionActive() {
        return this.currentSessionId !== null;
    }
    
    // Get session ID
    getSessionId() {
        return this.currentSessionId;
    }
    
    // Force save (for important events)
    async forceSave() {
        this.lastSaveTime = 0; // Reset last save time to force immediate save
        return await this.savePlayerProfile();
    }
    
    // Handle player death
    async onPlayerDeath() {
        console.log('💀 GameSessionManager: Player death detected');
        
        // Update session data
        this.updateSessionData();
        
        // Force save before ending session
        await this.forceSave();
        
        // End session
        return await this.endSession();
    }
    
    // Handle game completion
    async onGameComplete() {
        console.log('🎉 GameSessionManager: Game completed');
        
        // Update session data
        this.updateSessionData();
        
        // Force save
        await this.forceSave();
        
        // End session
        return await this.endSession();
    }
    
    // Handle level completion
    async onLevelComplete(levelNumber) {
        console.log(`🏆 GameSessionManager: Level ${levelNumber} completed`);
        
        this.updateSessionStats('level_completed');
        this.updateSessionStats('level_reached', levelNumber);
        
        // Save after level completion
        await this.savePlayerProfile();
    }
    
    // Handle enemy kill
    async onEnemyKilled() {
        this.updateSessionStats('enemy_killed');
    }
    
    // Handle bomb usage
    async onBombUsed() {
        this.updateSessionStats('bomb_used');
    }
    
    // Handle score earned
    async onScoreEarned(score) {
        this.updateSessionStats('score', score);
    }
    
    // Handle tokens earned
    async onTokensEarned(tokens) {
        this.updateSessionStats('tokens', tokens);
    }
    
    // Debug method to display current session data
    getDebugInfo() {
        this.updateSessionData();
        return {
            session_id: this.currentSessionId,
            wallet_address: this.currentWallet,
            is_active: this.isSessionActive(),
            is_connected: this.isConnected,
            session_start_time: this.sessionStartTime,
            session_duration: this.sessionStartTime ? Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0,
            session_data: { ...this.sessionData },
            last_save_time: this.lastSaveTime,
            real_time_updates_active: !!this.realTimeUpdateInterval
        };
    }
    
    // Display session data in console for debugging
    logSessionData() {
        const debugInfo = this.getDebugInfo();
        console.log('🎮 GameSessionManager Debug Info:', debugInfo);
        return debugInfo;
    }
}

// Export for use in other modules
window.GameSessionManager = GameSessionManager;

// Global test function for debugging
window.testGameSessionManager = function() {
    console.log('🧪 Testing GameSessionManager...');
    
    if (!window.gameSessionManager) {
        console.error('❌ GameSessionManager not found!');
        return;
    }
    
    const debugInfo = window.gameSessionManager.getDebugInfo();
    console.log('📊 Current GameSessionManager state:', debugInfo);
    
    if (window.walletConnection && window.walletConnection.isConnected) {
        const walletAddress = window.walletConnection.publicKey.toString();
        console.log('💰 Wallet connected:', walletAddress);
        
        // Test session start
        window.gameSessionManager.startSession(walletAddress).then(result => {
            console.log('🎮 Session start test result:', result);
            
            if (result.success) {
                // Test some events
                window.gameSessionManager.onEnemyKilled();
                window.gameSessionManager.onScoreEarned(100);
                window.gameSessionManager.onTokensEarned(10);
                window.gameSessionManager.onBombUsed();
                
                console.log('✅ Test events triggered');
                window.gameSessionManager.logSessionData();
                
                // Test session end
                setTimeout(() => {
                    window.gameSessionManager.endSession().then(endResult => {
                        console.log('🏁 Session end test result:', endResult);
                    });
                }, 2000);
            }
        });
    } else {
        console.log('⚠️ No wallet connected for testing');
    }
};

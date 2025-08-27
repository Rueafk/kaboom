const BlockchainService = require('./blockchain-service');

class BlockchainDataManager {
    constructor() {
        this.blockchainService = new BlockchainService();
        
        // Force enable in production, check env var in development
        const isProduction = process.env.NODE_ENV === 'production';
        this.isEnabled = isProduction ? true : (process.env.ENABLE_BLOCKCHAIN === 'true' || false);
        
        this.fallbackToLocal = true;
        this.syncQueue = [];
        this.isProcessingQueue = false;
        
        console.log(`🔗 Blockchain Data Manager initialized - Enabled: ${this.isEnabled} (Production: ${isProduction})`);
        console.log(`🔗 Environment: NODE_ENV=${process.env.NODE_ENV}, ENABLE_BLOCKCHAIN=${process.env.ENABLE_BLOCKCHAIN}`);
    }
    
    // Store player profile on blockchain
    async storePlayerProfile(playerData) {
        if (!this.isEnabled) {
            console.log('⚠️ Blockchain storage disabled, using local storage only');
            return { success: false, error: 'Blockchain storage disabled' };
        }
        
        try {
            console.log('🔗 Storing player profile on blockchain:', playerData.wallet_address);
            
            // Add to sync queue for batch processing
            this.syncQueue.push({
                type: 'player_profile',
                data: playerData,
                timestamp: Date.now()
            });
            
            // Process queue if not already processing
            if (!this.isProcessingQueue) {
                await this.processSyncQueue();
            }
            
            return { success: true, message: 'Player profile queued for blockchain storage' };
            
        } catch (error) {
            console.error('❌ Error storing player profile on blockchain:', error);
            
            if (this.fallbackToLocal) {
                console.log('🔄 Falling back to local storage');
                return { success: false, error: error.message, fallback: true };
            }
            
            throw error;
        }
    }
    
    // Store game session on blockchain
    async storeGameSession(sessionData) {
        if (!this.isEnabled) {
            console.log('⚠️ Blockchain storage disabled, using local storage only');
            return { success: false, error: 'Blockchain storage disabled' };
        }
        
        try {
            console.log('🎮 Storing game session on blockchain:', sessionData.session_id);
            
            // Add to sync queue
            this.syncQueue.push({
                type: 'game_session',
                data: sessionData,
                timestamp: Date.now()
            });
            
            // Process queue if not already processing
            if (!this.isProcessingQueue) {
                await this.processSyncQueue();
            }
            
            return { success: true, message: 'Game session queued for blockchain storage' };
            
        } catch (error) {
            console.error('❌ Error storing game session on blockchain:', error);
            
            if (this.fallbackToLocal) {
                console.log('🔄 Falling back to local storage');
                return { success: false, error: error.message, fallback: true };
            }
            
            throw error;
        }
    }
    
    // Award BOOM tokens to player
    async awardBoomTokens(walletAddress, amount, reason = 'game_reward') {
        if (!this.isEnabled) {
            console.log('⚠️ Blockchain storage disabled, cannot award tokens');
            return { success: false, error: 'Blockchain storage disabled' };
        }
        
        try {
            console.log(`🪙 Awarding ${amount} BOOM tokens to ${walletAddress} for: ${reason}`);
            
            const result = await this.blockchainService.awardBoomTokens(walletAddress, amount);
            
            // Log the reward
            this.syncQueue.push({
                type: 'token_reward',
                data: {
                    wallet_address: walletAddress,
                    amount: amount,
                    reason: reason,
                    timestamp: new Date().toISOString()
                },
                timestamp: Date.now()
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Error awarding BOOM tokens:', error);
            throw error;
        }
    }
    
    // Get player's BOOM token balance
    async getBoomTokenBalance(walletAddress) {
        if (!this.isEnabled) {
            console.log('⚠️ Blockchain storage disabled, returning 0 balance');
            return { success: true, balance: 0, token_account: null };
        }
        
        try {
            return await this.blockchainService.getBoomTokenBalance(walletAddress);
        } catch (error) {
            console.error('❌ Error getting BOOM token balance:', error);
            return { success: false, error: error.message, balance: 0 };
        }
    }
    
    // Store achievement on blockchain
    async storeAchievement(achievementData) {
        if (!this.isEnabled) {
            console.log('⚠️ Blockchain storage disabled, using local storage only');
            return { success: false, error: 'Blockchain storage disabled' };
        }
        
        try {
            console.log('🏆 Storing achievement on blockchain:', achievementData.achievement_id);
            
            // Add to sync queue
            this.syncQueue.push({
                type: 'achievement',
                data: achievementData,
                timestamp: Date.now()
            });
            
            // Process queue if not already processing
            if (!this.isProcessingQueue) {
                await this.processSyncQueue();
            }
            
            return { success: true, message: 'Achievement queued for blockchain storage' };
            
        } catch (error) {
            console.error('❌ Error storing achievement on blockchain:', error);
            
            if (this.fallbackToLocal) {
                console.log('🔄 Falling back to local storage');
                return { success: false, error: error.message, fallback: true };
            }
            
            throw error;
        }
    }
    
    // Process sync queue
    async processSyncQueue() {
        if (this.isProcessingQueue || this.syncQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        try {
            console.log(`🔄 Processing ${this.syncQueue.length} items in sync queue...`);
            
            const batchSize = 5; // Process in batches to avoid rate limits
            const batch = this.syncQueue.splice(0, batchSize);
            
            for (const item of batch) {
                try {
                    switch (item.type) {
                        case 'player_profile':
                            await this.blockchainService.storePlayerProfile(item.data);
                            break;
                        case 'game_session':
                            await this.blockchainService.storeGameSession(item.data);
                            break;
                        case 'achievement':
                            await this.blockchainService.storeAchievement(item.data);
                            break;
                        case 'token_reward':
                            // Token rewards are processed immediately, just log them
                            console.log('📝 Token reward logged:', item.data);
                            break;
                        default:
                            console.warn('⚠️ Unknown sync item type:', item.type);
                    }
                } catch (error) {
                    console.error(`❌ Error processing ${item.type}:`, error);
                    
                    // Put item back in queue for retry (with exponential backoff)
                    if (item.retryCount < 3) {
                        item.retryCount = (item.retryCount || 0) + 1;
                        item.timestamp = Date.now() + (item.retryCount * 60000); // 1, 2, 3 minutes
                        this.syncQueue.push(item);
                    }
                }
            }
            
            console.log(`✅ Processed ${batch.length} items from sync queue`);
            
        } catch (error) {
            console.error('❌ Error processing sync queue:', error);
        } finally {
            this.isProcessingQueue = false;
            
            // Process remaining items if any
            if (this.syncQueue.length > 0) {
                setTimeout(() => this.processSyncQueue(), 1000);
            }
        }
    }
    
    // Get blockchain status
    async getBlockchainStatus() {
        try {
            const status = await this.blockchainService.getBlockchainStatus();
            return {
                ...status,
                enabled: this.isEnabled,
                queue_length: this.syncQueue.length,
                processing_queue: this.isProcessingQueue
            };
        } catch (error) {
            return {
                connected: false,
                enabled: this.isEnabled,
                error: error.message,
                queue_length: this.syncQueue.length,
                processing_queue: this.isProcessingQueue
            };
        }
    }
    
    // Enable/disable blockchain storage
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`🔗 Blockchain storage ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    // Set fallback behavior
    setFallbackToLocal(fallback) {
        this.fallbackToLocal = fallback;
        console.log(`🔄 Fallback to local storage ${fallback ? 'enabled' : 'disabled'}`);
    }
    
    // Clear sync queue
    clearSyncQueue() {
        const queueLength = this.syncQueue.length;
        this.syncQueue = [];
        console.log(`🗑️ Cleared ${queueLength} items from sync queue`);
    }
    
    // Get sync queue status
    getSyncQueueStatus() {
        return {
            length: this.syncQueue.length,
            processing: this.isProcessingQueue,
            items: this.syncQueue.map(item => ({
                type: item.type,
                timestamp: item.timestamp,
                retry_count: item.retryCount || 0
            }))
        };
    }
    
    // Force process queue
    async forceProcessQueue() {
        console.log('🔄 Force processing sync queue...');
        await this.processSyncQueue();
    }
    
    // Sync local data to blockchain
    async syncLocalDataToBlockchain(localData) {
        if (!this.isEnabled) {
            console.log('⚠️ Blockchain storage disabled, cannot sync local data');
            return { success: false, error: 'Blockchain storage disabled' };
        }
        
        try {
            console.log('🔄 Syncing local data to blockchain...');
            
            const results = [];
            
            // Sync player profiles
            if (localData.players) {
                for (const player of localData.players) {
                    try {
                        const result = await this.blockchainService.storePlayerProfile(player);
                        results.push({ type: 'player_profile', success: true, data: result });
                    } catch (error) {
                        results.push({ type: 'player_profile', success: false, error: error.message });
                    }
                }
            }
            
            // Sync game sessions
            if (localData.sessions) {
                for (const session of localData.sessions) {
                    try {
                        const result = await this.blockchainService.storeGameSession(session);
                        results.push({ type: 'game_session', success: true, data: result });
                    } catch (error) {
                        results.push({ type: 'game_session', success: false, error: error.message });
                    }
                }
            }
            
            // Sync achievements
            if (localData.achievements) {
                for (const achievement of localData.achievements) {
                    try {
                        const result = await this.blockchainService.storeAchievement(achievement);
                        results.push({ type: 'achievement', success: true, data: result });
                    } catch (error) {
                        results.push({ type: 'achievement', success: false, error: error.message });
                    }
                }
            }
            
            console.log(`✅ Synced ${results.length} items to blockchain`);
            
            return {
                success: true,
                results: results,
                summary: {
                    total: results.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length
                }
            };
            
        } catch (error) {
            console.error('❌ Error syncing local data to blockchain:', error);
            throw error;
        }
    }
}

module.exports = BlockchainDataManager;

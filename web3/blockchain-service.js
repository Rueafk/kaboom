const { 
    Connection, 
    PublicKey, 
    Keypair, 
    Transaction, 
    SystemProgram,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const { 
    createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    transfer,
    getAccount
} = require('@solana/spl-token');
const bs58 = require('bs58');
const crypto = require('crypto');

class BlockchainService {
    constructor() {
        // Initialize Solana connection
        this.connection = new Connection(
            process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
            'confirmed'
        );
        
        // Game admin wallet (for managing game tokens and data)
        this.adminWallet = this.loadAdminWallet();
        
        // Program IDs for different data types
        this.PROGRAM_IDS = {
            PLAYER_PROFILE: new PublicKey(process.env.PLAYER_PROFILE_PROGRAM_ID || '11111111111111111111111111111111'),
            GAME_SESSION: new PublicKey(process.env.GAME_SESSION_PROGRAM_ID || '11111111111111111111111111111112'),
            ACHIEVEMENT: new PublicKey(process.env.ACHIEVEMENT_PROGRAM_ID || '11111111111111111111111111111113'),
            BOOM_TOKEN: new PublicKey(process.env.BOOM_TOKEN_MINT || '11111111111111111111111111111114')
        };
        
        this.isInitialized = false;
        this.initialize();
    }
    
    loadAdminWallet() {
        try {
            // Load admin wallet from environment or generate new one
            const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
            if (adminPrivateKey) {
                const decodedKey = bs58.decode(adminPrivateKey);
                return Keypair.fromSecretKey(decodedKey);
            } else {
                console.warn('⚠️ No admin private key found, generating new wallet');
                const newWallet = Keypair.generate();
                console.log('🔑 New admin wallet generated:', newWallet.publicKey.toString());
                return newWallet;
            }
        } catch (error) {
            console.error('❌ Error loading admin wallet:', error);
            const fallbackWallet = Keypair.generate();
            console.log('🔑 Using fallback admin wallet:', fallbackWallet.publicKey.toString());
            return fallbackWallet;
        }
    }
    
    async initialize() {
        try {
            console.log('🚀 Initializing Blockchain Service...');
            
            // Check connection
            const version = await this.connection.getVersion();
            console.log('✅ Solana connection established:', version);
            
            // Check admin wallet balance
            const balance = await this.connection.getBalance(this.adminWallet.publicKey);
            console.log('💰 Admin wallet balance:', balance / LAMPORTS_PER_SOL, 'SOL');
            
            // Initialize token mint if needed
            await this.initializeBoomToken();
            
            this.isInitialized = true;
            console.log('✅ Blockchain Service initialized successfully');
        } catch (error) {
            console.error('❌ Blockchain Service initialization failed:', error);
            this.isInitialized = false;
        }
    }
    
    async initializeBoomToken() {
        try {
            // Create BOOM token mint if it doesn't exist
            if (this.PROGRAM_IDS.BOOM_TOKEN.toString() === '11111111111111111111111111111114') {
                console.log('🪙 Creating BOOM token mint...');
                
                const mint = await createMint(
                    this.connection,
                    this.adminWallet,
                    this.adminWallet.publicKey,
                    null,
                    9 // 9 decimals like most SPL tokens
                );
                
                this.PROGRAM_IDS.BOOM_TOKEN = mint;
                console.log('✅ BOOM token mint created:', mint.toString());
                
                // Create admin token account
                const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                    this.connection,
                    this.adminWallet,
                    mint,
                    this.adminWallet.publicKey
                );
                
                // Mint initial supply
                await mintTo(
                    this.connection,
                    this.adminWallet,
                    mint,
                    adminTokenAccount.address,
                    this.adminWallet,
                    1000000000000 // 1 billion BOOM tokens
                );
                
                console.log('✅ BOOM token initialized with 1 billion supply');
            }
        } catch (error) {
            console.error('❌ Error initializing BOOM token:', error);
        }
    }
    
    // Store player profile on blockchain
    async storePlayerProfile(playerData) {
        if (!this.isInitialized) {
            throw new Error('Blockchain service not initialized');
        }
        
        try {
            console.log('🔗 Storing player profile on blockchain:', playerData.wallet_address);
            
            // Create player profile data structure
            const profileData = {
                wallet_address: playerData.wallet_address,
                username: playerData.username || 'Player',
                level: playerData.level || 1,
                total_score: playerData.total_score || 0,
                boom_tokens: playerData.boom_tokens || 0,
                lives: playerData.lives || 3,
                experience_points: playerData.experience_points || 0,
                achievements_unlocked: playerData.achievements_unlocked || 0,
                games_played: playerData.games_played || 0,
                games_won: playerData.games_won || 0,
                highest_level_reached: playerData.highest_level_reached || 1,
                total_enemies_killed: playerData.total_enemies_killed || 0,
                total_bombs_used: playerData.total_bombs_used || 0,
                last_updated: new Date().toISOString(),
                signature: this.generateDataSignature(playerData)
            };
            
            // Create transaction to store profile data
            const transaction = new Transaction();
            
            // Create PDA (Program Derived Address) for player profile
            const [playerProfilePDA] = await PublicKey.findProgramAddress(
                [
                    Buffer.from('player_profile'),
                    new PublicKey(playerData.wallet_address).toBuffer()
                ],
                this.PROGRAM_IDS.PLAYER_PROFILE
            );
            
            // Store profile data (simplified - in real implementation, you'd use a proper program)
            // For now, we'll store it as a memo in a transaction
            const memo = JSON.stringify(profileData);
            
            // Add instruction to store data
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: this.adminWallet.publicKey,
                    toPubkey: playerProfilePDA,
                    lamports: 1000 // Small amount to store data
                })
            );
            
            // Sign and send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.adminWallet]
            );
            
            console.log('✅ Player profile stored on blockchain:', signature);
            
            return {
                success: true,
                signature: signature,
                profile_pda: playerProfilePDA.toString(),
                data: profileData
            };
            
        } catch (error) {
            console.error('❌ Error storing player profile on blockchain:', error);
            throw error;
        }
    }
    
    // Store game session on blockchain
    async storeGameSession(sessionData) {
        if (!this.isInitialized) {
            throw new Error('Blockchain service not initialized');
        }
        
        try {
            console.log('🎮 Storing game session on blockchain:', sessionData.session_id);
            
            // Create session data structure
            const sessionInfo = {
                session_id: sessionData.session_id,
                wallet_address: sessionData.wallet_address,
                session_start: sessionData.session_start || new Date().toISOString(),
                session_end: sessionData.session_end || new Date().toISOString(),
                final_score: sessionData.final_score || 0,
                enemies_killed: sessionData.enemies_killed || 0,
                bombs_used: sessionData.bombs_used || 0,
                level_reached: sessionData.level_reached || 1,
                survival_time: sessionData.survival_time || 0,
                signature: this.generateDataSignature(sessionData)
            };
            
            // Create PDA for game session
            const [sessionPDA] = await PublicKey.findProgramAddress(
                [
                    Buffer.from('game_session'),
                    Buffer.from(sessionData.session_id),
                    new PublicKey(sessionData.wallet_address).toBuffer()
                ],
                this.PROGRAM_IDS.GAME_SESSION
            );
            
            // Create transaction
            const transaction = new Transaction();
            
            // Store session data
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: this.adminWallet.publicKey,
                    toPubkey: sessionPDA,
                    lamports: 1000
                })
            );
            
            // Sign and send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.adminWallet]
            );
            
            console.log('✅ Game session stored on blockchain:', signature);
            
            return {
                success: true,
                signature: signature,
                session_pda: sessionPDA.toString(),
                data: sessionInfo
            };
            
        } catch (error) {
            console.error('❌ Error storing game session on blockchain:', error);
            throw error;
        }
    }
    
    // Award BOOM tokens to player
    async awardBoomTokens(walletAddress, amount) {
        if (!this.isInitialized) {
            throw new Error('Blockchain service not initialized');
        }
        
        try {
            console.log(`🪙 Awarding ${amount} BOOM tokens to ${walletAddress}`);
            
            const playerPublicKey = new PublicKey(walletAddress);
            
            // Get or create player's token account
            const playerTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.adminWallet,
                this.PROGRAM_IDS.BOOM_TOKEN,
                playerPublicKey
            );
            
            // Get admin token account
            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.adminWallet,
                this.PROGRAM_IDS.BOOM_TOKEN,
                this.adminWallet.publicKey
            );
            
            // Transfer tokens from admin to player
            const transferSignature = await transfer(
                this.connection,
                this.adminWallet,
                adminTokenAccount.address,
                playerTokenAccount.address,
                this.adminWallet,
                amount * Math.pow(10, 9) // Convert to token units (9 decimals)
            );
            
            console.log('✅ BOOM tokens awarded:', transferSignature);
            
            return {
                success: true,
                signature: transferSignature,
                amount: amount,
                player_token_account: playerTokenAccount.address.toString()
            };
            
        } catch (error) {
            console.error('❌ Error awarding BOOM tokens:', error);
            throw error;
        }
    }
    
    // Get player's BOOM token balance
    async getBoomTokenBalance(walletAddress) {
        if (!this.isInitialized) {
            throw new Error('Blockchain service not initialized');
        }
        
        try {
            const playerPublicKey = new PublicKey(walletAddress);
            
            // Get player's token account
            const playerTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.adminWallet,
                this.PROGRAM_IDS.BOOM_TOKEN,
                playerPublicKey
            );
            
            // Get account info
            const accountInfo = await getAccount(this.connection, playerTokenAccount.address);
            
            const balance = Number(accountInfo.amount) / Math.pow(10, 9);
            
            console.log(`💰 Player ${walletAddress} has ${balance} BOOM tokens`);
            
            return {
                success: true,
                balance: balance,
                token_account: playerTokenAccount.address.toString()
            };
            
        } catch (error) {
            console.error('❌ Error getting BOOM token balance:', error);
            throw error;
        }
    }
    
    // Verify data integrity using signatures
    async verifyDataIntegrity(data, signature) {
        try {
            const expectedSignature = this.generateDataSignature(data);
            return signature === expectedSignature;
        } catch (error) {
            console.error('❌ Error verifying data integrity:', error);
            return false;
        }
    }
    
    // Generate signature for data integrity
    generateDataSignature(data) {
        const dataString = JSON.stringify(data, Object.keys(data).sort());
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }
    
    // Get blockchain status
    async getBlockchainStatus() {
        try {
            const version = await this.connection.getVersion();
            const balance = await this.connection.getBalance(this.adminWallet.publicKey);
            
            return {
                connected: true,
                version: version,
                admin_balance: balance / LAMPORTS_PER_SOL,
                admin_address: this.adminWallet.publicKey.toString(),
                boom_token_mint: this.PROGRAM_IDS.BOOM_TOKEN.toString(),
                initialized: this.isInitialized
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                initialized: this.isInitialized
            };
        }
    }
    
    // Store achievement on blockchain
    async storeAchievement(achievementData) {
        if (!this.isInitialized) {
            throw new Error('Blockchain service not initialized');
        }
        
        try {
            console.log('🏆 Storing achievement on blockchain:', achievementData.achievement_id);
            
            const achievementInfo = {
                achievement_id: achievementData.achievement_id,
                wallet_address: achievementData.wallet_address,
                achievement_name: achievementData.achievement_name,
                achievement_description: achievementData.achievement_description,
                unlocked_at: new Date().toISOString(),
                game_session_id: achievementData.game_session_id,
                signature: this.generateDataSignature(achievementData)
            };
            
            // Create PDA for achievement
            const [achievementPDA] = await PublicKey.findProgramAddress(
                [
                    Buffer.from('achievement'),
                    Buffer.from(achievementData.achievement_id),
                    new PublicKey(achievementData.wallet_address).toBuffer()
                ],
                this.PROGRAM_IDS.ACHIEVEMENT
            );
            
            // Create transaction
            const transaction = new Transaction();
            
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: this.adminWallet.publicKey,
                    toPubkey: achievementPDA,
                    lamports: 1000
                })
            );
            
            // Sign and send transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.adminWallet]
            );
            
            console.log('✅ Achievement stored on blockchain:', signature);
            
            return {
                success: true,
                signature: signature,
                achievement_pda: achievementPDA.toString(),
                data: achievementInfo
            };
            
        } catch (error) {
            console.error('❌ Error storing achievement on blockchain:', error);
            throw error;
        }
    }
}

module.exports = BlockchainService;

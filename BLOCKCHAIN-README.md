# 🔗 Blockchain Integration for Kaboom Game

This document explains the blockchain integration that stores real player data on the Solana blockchain.

## 🌟 Features

### ✅ Implemented Features
- **Player Profile Storage**: Player data stored on Solana blockchain
- **Game Session Tracking**: Complete game sessions recorded on-chain
- **BOOM Token System**: Native SPL token for in-game rewards
- **Achievement System**: Achievements stored on blockchain
- **Data Integrity**: Cryptographic signatures for data verification
- **Sync Queue**: Batch processing for efficient blockchain operations
- **Fallback System**: Local storage when blockchain is unavailable
- **Admin Dashboard**: Real-time monitoring and management

### 🔧 Technical Features
- **Solana Integration**: Uses Solana devnet for development
- **SPL Token Support**: BOOM tokens as native game currency
- **Program Derived Addresses (PDAs)**: Secure data storage
- **Transaction Signing**: Admin wallet for secure operations
- **Real-time Sync**: Automatic data synchronization
- **Error Handling**: Robust error recovery and retry mechanisms

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# Blockchain Configuration
ENABLE_BLOCKCHAIN=true
SOLANA_RPC_URL=https://api.devnet.solana.com

# Admin wallet private key (base58 encoded)
ADMIN_PRIVATE_KEY=your_private_key_here

# Program IDs (optional - will use defaults if not set)
PLAYER_PROFILE_PROGRAM_ID=
GAME_SESSION_PROGRAM_ID=
ACHIEVEMENT_PROGRAM_ID=
BOOM_TOKEN_MINT=

# Server Configuration
PORT=8000
NODE_ENV=development
```

### 2. Generate Admin Wallet

Generate a new Solana wallet for admin operations:

```bash
node -e "
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const wallet = Keypair.generate();
console.log('Public Key:', wallet.publicKey.toString());
console.log('Private Key (base58):', bs58.encode(wallet.secretKey));
"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

### 5. Access Admin Dashboards

- **Main Admin Dashboard**: http://localhost:8000/admin
- **Blockchain Admin Dashboard**: http://localhost:8000/blockchain-admin

## 📊 Data Storage

### Player Profiles
```javascript
{
  wallet_address: "player_wallet_address",
  username: "Player Name",
  level: 1,
  total_score: 0,
  boom_tokens: 0,
  lives: 3,
  experience_points: 0,
  achievements_unlocked: 0,
  games_played: 0,
  games_won: 0,
  highest_level_reached: 1,
  total_enemies_killed: 0,
  total_bombs_used: 0,
  last_updated: "2024-01-01T00:00:00.000Z",
  signature: "data_integrity_signature"
}
```

### Game Sessions
```javascript
{
  session_id: "unique_session_id",
  wallet_address: "player_wallet_address",
  session_start: "2024-01-01T00:00:00.000Z",
  session_end: "2024-01-01T00:05:00.000Z",
  final_score: 1500,
  enemies_killed: 25,
  bombs_used: 10,
  level_reached: 3,
  survival_time: 300,
  signature: "data_integrity_signature"
}
```

### Achievements
```javascript
{
  achievement_id: "first_win",
  wallet_address: "player_wallet_address",
  achievement_name: "First Victory",
  achievement_description: "Win your first game",
  unlocked_at: "2024-01-01T00:05:00.000Z",
  game_session_id: "session_id",
  signature: "data_integrity_signature"
}
```

## 🔧 API Endpoints

### Blockchain Status
- `GET /api/blockchain/status` - Get blockchain connection status
- `GET /api/blockchain/sync-queue` - Get sync queue status

### Player Data
- `POST /api/blockchain/player-profile` - Store player profile on blockchain
- `GET /api/blockchain/token-balance/:walletAddress` - Get BOOM token balance

### Game Sessions
- `POST /api/blockchain/game-session` - Store game session on blockchain

### Token Management
- `POST /api/blockchain/award-tokens` - Award BOOM tokens to player

### Achievements
- `POST /api/blockchain/achievement` - Store achievement on blockchain

### Admin Operations
- `POST /api/blockchain/force-sync` - Force process sync queue

## 🎮 Game Integration

### Automatic Blockchain Storage
The game automatically stores data on the blockchain when:
- Player profile is updated
- Game session ends
- Achievements are unlocked
- Tokens are awarded

### Fallback System
If blockchain storage fails:
1. Data is saved to local database
2. Data is queued for retry
3. Game continues normally
4. Admin can manually sync later

### Real-time Updates
- Player data syncs every 5 seconds during gameplay
- Session data syncs when game ends
- Token balances update immediately

## 🔐 Security Features

### Data Integrity
- Cryptographic signatures for all stored data
- SHA-256 hashing for data verification
- Timestamp validation

### Access Control
- Admin wallet for all blockchain operations
- Private key stored securely in environment variables
- No direct user wallet access required

### Error Handling
- Automatic retry with exponential backoff
- Graceful degradation to local storage
- Comprehensive error logging

## 📈 Monitoring

### Blockchain Admin Dashboard
Monitor real-time blockchain status:
- Connection status
- Sync queue status
- Token balances
- Transaction history
- Error logs

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

## 🛠️ Development

### Local Development
```bash
# Enable blockchain storage
ENABLE_BLOCKCHAIN=true npm run dev

# Disable blockchain storage (local only)
ENABLE_BLOCKCHAIN=false npm run dev
```

### Testing
```bash
# Test blockchain connection
curl http://localhost:8000/api/blockchain/status

# Test token balance
curl http://localhost:8000/api/blockchain/token-balance/your_wallet_address

# Test sync queue
curl http://localhost:8000/api/blockchain/sync-queue
```

### Debugging
Check the console for detailed logs:
- Blockchain connection status
- Transaction signatures
- Sync queue processing
- Error messages

## 🚀 Production Deployment

### Environment Variables
```bash
# Production Solana RPC
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Production admin wallet
ADMIN_PRIVATE_KEY=your_production_private_key

# Enable blockchain
ENABLE_BLOCKCHAIN=true
```

### Security Considerations
- Use mainnet for production
- Secure admin private key storage
- Monitor transaction costs
- Implement rate limiting
- Regular backup procedures

## 📚 File Structure

```
web3/
├── blockchain-service.js      # Core blockchain operations
├── blockchain-data-manager.js # High-level data management
├── player-data-manager.js     # Player data integration
├── game-session-manager.js    # Session management
├── wallet-connection.js       # Wallet integration
├── recharge-manager.js        # Recharge system
└── reward-system.js          # Reward system

blockchain-admin.html          # Blockchain admin dashboard
env-template.txt              # Environment variables template
BLOCKCHAIN-README.md          # This documentation
```

## 🔄 Migration from Local Storage

### Automatic Migration
The system automatically migrates existing data:
1. Loads local player data
2. Syncs to blockchain
3. Maintains local backup
4. Continues normal operation

### Manual Migration
```javascript
// Sync specific player data
const localData = {
  players: [playerData],
  sessions: [sessionData],
  achievements: [achievementData]
};

await blockchainManager.syncLocalDataToBlockchain(localData);
```

## 🆘 Troubleshooting

### Common Issues

**Blockchain Connection Failed**
- Check SOLANA_RPC_URL
- Verify network connectivity
- Check admin wallet balance

**Token Transfer Failed**
- Verify admin wallet has sufficient SOL
- Check token mint address
- Verify player wallet address

**Sync Queue Stuck**
- Check for network errors
- Verify admin private key
- Force sync from admin dashboard

**Data Not Storing**
- Check ENABLE_BLOCKCHAIN setting
- Verify database connection
- Check console for errors

### Error Codes
- `BLOCKCHAIN_NOT_INITIALIZED` - Service not started
- `INSUFFICIENT_BALANCE` - Admin wallet needs SOL
- `INVALID_WALLET` - Wallet address format error
- `NETWORK_ERROR` - Solana network issues

## 📞 Support

For issues or questions:
1. Check the console logs
2. Review the admin dashboard
3. Verify environment configuration
4. Test with simple API calls

## 🔮 Future Enhancements

- **NFT Integration**: Player achievements as NFTs
- **DeFi Features**: Token staking and yield farming
- **Cross-chain Support**: Multi-chain data storage
- **Advanced Analytics**: On-chain game analytics
- **Community Features**: Player leaderboards on-chain

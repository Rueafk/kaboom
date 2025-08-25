# 🎮 Kaboom Game - Blockchain Edition

A modern web3-enabled game with real-time player data, recharge system, and comprehensive admin dashboard.

## ✨ Features

### 🎮 Player Features
- **Wallet Integration** - Connect Phantom, Solflare, and other Solana wallets
- **Real-time Recharge System** - 45-minute cooldown with persistence
- **Player Profiles** - Complete statistics and achievements
- **Leaderboards** - Dynamic rankings and competition
- **Achievement System** - Unlock rewards and track progress
- **Game Session History** - Detailed match records

### 🔧 Admin Features
- **Player Management** - View and manage all players
- **Game Analytics** - Real-time statistics and insights
- **Anti-cheat System** - Session validation and monitoring
- **Achievement Management** - Create and manage achievements
- **System Health** - Monitor server performance

### 🛡️ Technical Features
- **SQLite Database** - Persistent data storage
- **RESTful API** - Complete backend integration
- **CORS Security** - Production-ready security
- **Session Management** - Secure player sessions
- **Background Tasks** - Automated maintenance

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)
    ↓
Backend (Node.js/Express)
    ↓
Database (SQLite)
    ↓
Web3 Integration (Solana)
```

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- Git
- GitHub Account
- Render Account (free)

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/kaboom-game.git
cd kaboom-game

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## 🚀 Deployment

### Deploy to Koyeb

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Koyeb**
   - Go to [koyeb.com](https://koyeb.com)
   - Connect your GitHub repository
   - Deploy automatically

3. **Get Your URL**
   - Your game will be live at: `https://kaboom-game-rueafk.koyeb.app`

**For detailed instructions, see [KOYEB_DEPLOYMENT.md](KOYEB_DEPLOYMENT.md)**

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=development
PORT=3000
```

## 📊 API Endpoints

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/analytics/dashboard` - Game analytics

### Player Management
- `GET /api/players` - List all players
- `POST /api/players` - Create/update player
- `GET /api/players/:walletAddress` - Get player details

### Game Sessions
- `POST /api/sessions/start` - Start game session
- `POST /api/sessions/end` - End game session

### Recharge System
- `GET /api/recharge/:walletAddress` - Get recharge status
- `POST /api/recharge/start/:walletAddress` - Start recharge
- `POST /api/recharge/complete/:walletAddress` - Complete recharge

### Leaderboards
- `GET /api/leaderboards/score` - Score leaderboard
- `GET /api/leaderboards/level` - Level leaderboard
- `GET /api/leaderboards/tokens` - Token leaderboard

## 🎯 Game Features

### Core Gameplay
- **Platformer Action** - Jump, run, and survive
- **Enemy Combat** - Fight various pirate enemies
- **Bomb Mechanics** - Strategic explosive gameplay
- **Level Progression** - Increasing difficulty

### Web3 Integration
- **Wallet Connection** - Secure Solana wallet integration
- **Token Rewards** - Earn BOOM tokens for achievements
- **Blockchain Verification** - Anti-cheat with blockchain data
- **Session Signing** - Secure game session authentication

## 🛡️ Security Features

- **Session Validation** - Cryptographic session verification
- **Anti-cheat System** - Score and time validation
- **CORS Protection** - Cross-origin request security
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Secure data handling

## 📈 Performance

- **SQLite Database** - Fast local data storage
- **Optimized Assets** - Compressed sprites and audio
- **CDN Ready** - Static assets optimized for delivery
- **Background Processing** - Non-blocking operations

## 🔄 Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with hot reload
npm install        # Install dependencies
```

### File Structure

```
├── server.js              # Main server file
├── index.html             # Game frontend
├── game.js                # Game logic
├── web3/                  # Web3 integration
├── admin-dashboard.html   # Admin panel
└── README.md             # This file
```

## 🚨 Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 3000 is available
   - Ensure Node.js 16+ is installed

2. **Database Issues**
   - Check if database file is created
   - Monitor logs for database errors

3. **CORS Errors**
   - Check browser console for errors
   - Verify localhost URLs

### Getting Help

- **GitHub Issues:** Report bugs and feature requests
- **Discord:** Join our community

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎉 Acknowledgments

- **Solana Web3.js** - Blockchain integration
- **Express.js** - Backend framework
- **SQLite** - Database solution

---

**Built with ❤️ for the Web3 gaming community** 🎮✨

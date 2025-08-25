# 🎮 Kaboom Game - Blockchain Edition

A modern web3-enabled game with real-time player data, recharge system, and comprehensive admin dashboard.

## 🚀 Live Demo

**Game:** [https://kaboom-game-server.onrender.com](https://kaboom-game-server.onrender.com)  
**Admin Dashboard:** [https://kaboom-game-server.onrender.com/admin-dashboard.html](https://kaboom-game-server.onrender.com/admin-dashboard.html)

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

## 🚀 Deployment

### Quick Deploy to Render

1. **Fork/Clone this repository**
2. **Create Render account** at [render.com](https://render.com)
3. **Connect GitHub repository**
4. **Deploy automatically** - Follow [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

### Manual Deployment

```bash
# Prepare for deployment
./deploy-setup.sh

# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# Deploy to Render
# Follow RENDER_DEPLOYMENT.md for detailed steps
```

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=production
PORT=10000
```

### CORS Settings

Update `server.js` with your Render URL:

```javascript
const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://your-app-name.onrender.com']
    : ['http://localhost:3000'];
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
├── render.yaml            # Render deployment config
└── README.md             # This file
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update allowed origins in `server.js`
   - Check your Render URL

2. **Database Issues**
   - SQLite should work on Render
   - Check logs for database errors

3. **Build Fails**
   - Ensure Node.js 16+
   - Check `package.json` scripts

### Getting Help

- **Render Docs:** https://render.com/docs
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
- **Render** - Hosting platform

---

**Built with ❤️ for the Web3 gaming community** 🎮✨

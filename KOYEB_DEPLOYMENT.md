# 🚀 GitHub + Koyeb Deployment Guide

## 📋 Prerequisites

1. **GitHub Account** - Your code repository
2. **Koyeb Account** - For hosting (free tier available)
3. **Git** - For version control

## 🎯 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Ready for Koyeb deployment"

# Add your GitHub repository
git remote add origin https://github.com/Rueafk/kaboom.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Koyeb

1. **Go to Koyeb**
   - Visit [koyeb.com](https://koyeb.com)
   - Click "Get Started" or "Sign Up"

2. **Create Account**
   - Sign up with GitHub account
   - Authorize Koyeb to access your repositories

3. **Create New App**
   - Click "Create App"
   - Choose "GitHub" as source
   - Select your repository: `Rueafk/kaboom`

4. **Configure App**
   - **App Name:** `kaboom-game`
   - **Environment:** `Node.js` (auto-detected)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Port:** `8080`

5. **Environment Variables**
   - Click "Environment Variables"
   - Add: `NODE_ENV` = `production`
   - Add: `PORT` = `8080`

6. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes for deployment

### Step 3: Get Your URLs

After deployment, you'll get:
- **Production URL:** `https://kaboom-game-rueafk.koyeb.app`
- **Custom Domain:** Available (optional)

## 🎮 Testing Your Deployment

### Health Check
```
https://kaboom-game-rueafk.koyeb.app/api/health
```

### Game URL
```
https://kaboom-game-rueafk.koyeb.app/
```

### Admin Dashboard
```
https://kaboom-game-rueafk.koyeb.app/admin-dashboard.html
```

## 🔧 Features That Will Work

### ✅ Player Features
- Wallet connection (Phantom, Solflare, etc.)
- Real-time recharge system (45-minute cooldown)
- Player profiles and statistics
- Achievement tracking
- Leaderboard rankings
- Game session history

### ✅ Admin Features
- Player management
- Game analytics
- Anti-cheat monitoring
- Achievement management
- System health monitoring

### ✅ Technical Features
- SQLite database (persistent data)
- RESTful API endpoints
- CORS security
- Session management
- Background maintenance tasks

## 🚨 Important Notes

### Database Persistence
- SQLite works on Koyeb
- Data persists between deployments
- Automatic backups included

### Free Tier Limitations
- **Koyeb Free:** 2 apps, 512MB RAM each
- **Auto-sleep:** After inactivity
- **Wake-up time:** 30-60 seconds after first request

### Custom Domain (Optional)
- Koyeb supports custom domains
- SSL certificates included
- Professional URLs available

## 🔄 Continuous Deployment

- **Automatic:** Every push to `main` branch triggers deployment
- **Manual:** You can trigger deployments from Koyeb dashboard
- **Rollback:** Easy rollback to previous versions

## 📊 Monitoring

### Koyeb Dashboard
- Real-time logs
- Performance metrics
- Error tracking
- Uptime monitoring

### Health Endpoints
- `/api/health` - Server status
- `/api/analytics/dashboard` - Game analytics

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (>=14)
   - Verify `package.json` scripts
   - Check build logs in Koyeb dashboard

2. **CORS Errors**
   - Update allowed origins in `server.js`
   - Make sure your Koyeb URL is correct
   - Check browser console for errors

3. **Database Issues**
   - SQLite should work fine on Koyeb
   - Check if database file is created
   - Monitor logs for database errors

4. **Port Issues**
   - Koyeb uses port 8080
   - Make sure server.js uses `process.env.PORT`

### Getting Help

- **Koyeb Docs:** https://docs.koyeb.com
- **Koyeb Support:** Available in dashboard
- **GitHub Issues:** For code-related problems

## 🎉 Success!

After deployment, your game will be:
- ✅ **Live and accessible** worldwide
- ✅ **Real-time data** working
- ✅ **Recharge system** functional
- ✅ **Admin dashboard** available
- ✅ **All features** operational

**Your game URL:** `https://kaboom-game-rueafk.koyeb.app`

---

**Share your game with the world!** 🎮✨

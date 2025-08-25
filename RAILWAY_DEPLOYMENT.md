# 🚀 Railway Deployment Guide (FREE - No Credit Card Required)

## 📋 Prerequisites

1. **GitHub Account** - Your code is already there
2. **Railway Account** - Free signup, no credit card needed
3. **5 minutes** - Setup time

## 🎯 Step-by-Step Railway Deployment

### Step 1: Create Railway Account

1. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Click "Start a New Project"

2. **Sign Up with GitHub**
   - Choose "Deploy from GitHub repo"
   - Authorize Railway to access your repositories
   - **No credit card required!**

### Step 2: Deploy Your Game

1. **Select Repository**
   - Find and select `Jetsubtc/kaboom`
   - Railway will auto-detect it's a Node.js app

2. **Configure Project**
   - **Project Name:** `kaboom-game`
   - **Environment:** `Node.js` (auto-detected)
   - **Build Command:** `npm install` (auto-detected)
   - **Start Command:** `npm start` (auto-detected)

3. **Environment Variables**
   - Click "Variables" tab
   - Add: `NODE_ENV` = `production`
   - Add: `PORT` = `3000`

4. **Deploy**
   - Click "Deploy Now"
   - Wait 2-3 minutes for deployment

### Step 3: Get Your URLs

After deployment, you'll get:
- **Production URL:** `https://kaboom-game-production-xxxx.up.railway.app`
- **Custom Domain:** Available (optional)

## 🎮 Testing Your Deployment

### Health Check
```
https://kaboom-game-production-xxxx.up.railway.app/api/health
```

### Game URL
```
https://kaboom-game-production-xxxx.up.railway.app/
```

### Admin Dashboard
```
https://kaboom-game-production-xxxx.up.railway.app/admin-dashboard.html
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
- SQLite works on Railway
- Data persists between deployments
- Automatic backups included

### Free Tier Limitations
- **Railway Free:** 500 hours/month
- **Auto-sleep:** After inactivity
- **Wake-up time:** 30-60 seconds after first request

### Custom Domain (Optional)
- Railway supports custom domains
- SSL certificates included
- Professional URLs available

## 🔄 Continuous Deployment

- **Automatic:** Every push to `main` branch triggers deployment
- **Manual:** You can trigger deployments from Railway dashboard
- **Rollback:** Easy rollback to previous versions

## 📊 Monitoring

### Railway Dashboard
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
   - Check Node.js version (>=16)
   - Verify `package.json` scripts
   - Check build logs in Railway dashboard

2. **CORS Errors**
   - Update allowed origins in `server.js`
   - Make sure your Railway URL is correct
   - Check browser console for errors

3. **Database Issues**
   - SQLite should work fine on Railway
   - Check if database file is being created
   - Monitor logs for database errors

4. **Port Issues**
   - Railway auto-assigns PORT
   - Make sure server.js uses `process.env.PORT`

### Getting Help

- **Railway Docs:** https://docs.railway.app
- **Railway Support:** Available in dashboard
- **GitHub Issues:** For code-related problems

## 🎉 Success!

After deployment, your game will be:
- ✅ **Live and accessible** worldwide
- ✅ **Real-time data** working
- ✅ **Recharge system** functional
- ✅ **Admin dashboard** available
- ✅ **All features** operational

**Your game URL:** `https://kaboom-game-production-xxxx.up.railway.app`

---

**Share your game with the world!** 🎮✨

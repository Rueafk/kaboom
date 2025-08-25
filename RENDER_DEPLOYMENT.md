# 🚀 GitHub + Render Deployment Guide

## 📋 Prerequisites

1. **GitHub Account** - For code hosting
2. **Render Account** - For hosting (free tier available)
3. **Git** - For version control

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Code

```bash
# Make sure you're in the project directory
cd "Pirate Bomb (Progress)"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit - Kaboom Game ready for deployment"

# Create a new repository on GitHub (don't initialize with README)
# Then push your code
git remote add origin https://github.com/YOUR_USERNAME/kaboom-game.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render

1. **Go to Render**
   - Visit [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository
   - Select the `kaboom-game` repository

3. **Configure the Service**
   - **Name:** `kaboom-game-server`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

4. **Environment Variables**
   - Click "Environment" tab
   - Add: `NODE_ENV` = `production`
   - Add: `PORT` = `10000`

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Your URL will be: `https://kaboom-game-server.onrender.com`

### Step 3: Update CORS (Important!)

After deployment, update the allowed origins in `server.js`:

```javascript
const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://kaboom-game-server.onrender.com'] // Your actual Render URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
```

Then commit and push:
```bash
git add server.js
git commit -m "Update CORS for production"
git push
```

Render will automatically redeploy when you push changes.

## 🎮 Testing Your Deployment

### Health Check
```
https://kaboom-game-server.onrender.com/api/health
```

### Game URL
```
https://kaboom-game-server.onrender.com/
```

### Admin Dashboard
```
https://kaboom-game-server.onrender.com/admin-dashboard.html
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
- SQLite works on Render
- Data persists between deployments
- Automatic backups included

### Free Tier Limitations
- **Render Free:** 750 hours/month
- **Auto-sleep:** After 15 minutes of inactivity
- **Wake-up time:** 30-60 seconds after first request

### Custom Domain (Optional)
- Render supports custom domains
- SSL certificates included
- Professional URLs available

## 🔄 Continuous Deployment

- **Automatic:** Every push to `main` branch triggers deployment
- **Manual:** You can trigger deployments from Render dashboard
- **Rollback:** Easy rollback to previous versions

## 📊 Monitoring

### Render Dashboard
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
   - Check build logs in Render dashboard

2. **CORS Errors**
   - Update allowed origins in `server.js`
   - Make sure your Render URL is correct
   - Check browser console for errors

3. **Database Issues**
   - SQLite should work fine on Render
   - Check if database file is being created
   - Monitor logs for database errors

4. **Port Issues**
   - Render auto-assigns PORT
   - Make sure server.js uses `process.env.PORT`

### Getting Help

- **Render Docs:** https://render.com/docs
- **Render Support:** Available in dashboard
- **GitHub Issues:** For code-related problems

## 🎉 Success!

After deployment, your game will be:
- ✅ **Live and accessible** worldwide
- ✅ **Real-time data** working
- ✅ **Recharge system** functional
- ✅ **Admin dashboard** available
- ✅ **All features** operational

**Your game URL:** `https://kaboom-game-server.onrender.com`

---

**Share your game with the world!** 🎮✨

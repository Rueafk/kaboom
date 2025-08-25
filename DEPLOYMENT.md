# 🚀 Kaboom Game Deployment Guide

This guide will help you deploy your Kaboom game with real-time data, player profiles, and recharge system to various hosting platforms.

## 📋 Prerequisites

1. **GitHub Account** - For code hosting
2. **Node.js** - Version 14 or higher
3. **Git** - For version control

## 🎯 Deployment Options

### Option 1: Railway (Recommended - Easiest)

**Pros:** Free tier, easy setup, supports Node.js
**Cons:** Limited free usage

#### Steps:
1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Node.js

3. **Configure Environment**
   - Set `NODE_ENV=production`
   - Railway will auto-assign a PORT

4. **Get Your URL**
   - Railway provides: `https://your-app-name.railway.app`

### Option 2: Render (Recommended - Reliable)

**Pros:** Free tier, good performance, supports Node.js
**Cons:** Free tier limitations

#### Steps:
1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Configure Environment**
   - Environment: `Node`
   - Plan: `Free`
   - Auto-deploy: `Yes`

4. **Get Your URL**
   - Render provides: `https://your-app-name.onrender.com`

### Option 3: Heroku (Paid)

**Pros:** Well-established, good documentation
**Cons:** No free tier anymore

#### Steps:
1. **Create Heroku Account**
   - Go to [heroku.com](https://heroku.com)
   - Sign up

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Deploy**
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

4. **Get Your URL**
   - Heroku provides: `https://your-app-name.herokuapp.com`

## 🔧 Configuration

### Update CORS Origins

After deployment, update the allowed origins in `server.js`:

```javascript
const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://your-actual-app-name.onrender.com'] // Replace with your actual URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
```

### Environment Variables

Set these in your hosting platform:

- `NODE_ENV=production`
- `PORT` (usually auto-assigned)

## 📊 Database Persistence

### SQLite in Production

The current setup uses SQLite which works for:
- ✅ Railway
- ✅ Render
- ✅ Heroku (with limitations)

**Note:** SQLite data may reset on server restarts on some platforms. For production, consider:
- PostgreSQL (Railway/Render/Heroku)
- MongoDB Atlas (free tier available)

## 🎮 Testing Your Deployment

1. **Health Check**
   ```
   https://your-app-url/api/health
   ```

2. **Game URL**
   ```
   https://your-app-url/
   ```

3. **Admin Dashboard**
   ```
   https://your-app-url/admin-dashboard.html
   ```

## 🔄 Continuous Deployment

All platforms support automatic deployment:
- Push to GitHub → Auto-deploy to hosting
- No manual deployment needed

## 📱 Frontend-Only Option (GitHub Pages)

If you only want to deploy the frontend:

1. **Create GitHub Repository**
2. **Push your code**
3. **Enable GitHub Pages**
   - Settings → Pages → Source: Deploy from branch
   - Select `main` branch

**Note:** This will only work for the frontend. No backend features (recharge, profiles, etc.) will work.

## 🚨 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version (>=14)
   - Verify `package.json` scripts

2. **CORS Errors**
   - Update allowed origins in `server.js`
   - Check your actual deployment URL

3. **Database Issues**
   - SQLite may not persist on some platforms
   - Consider PostgreSQL for production

4. **Port Issues**
   - Most platforms auto-assign PORT
   - Check environment variables

## 📞 Support

- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Render:** [render.com/docs](https://render.com/docs)
- **Heroku:** [devcenter.heroku.com](https://devcenter.heroku.com)

## 🎯 Recommended Workflow

1. **Start with Railway** (easiest)
2. **Test thoroughly**
3. **Scale to Render** if needed
4. **Consider paid options** for production

---

**Your game will have:**
- ✅ Real-time player data
- ✅ Working recharge system
- ✅ Player profiles
- ✅ Admin dashboard
- ✅ Leaderboards
- ✅ Achievement system

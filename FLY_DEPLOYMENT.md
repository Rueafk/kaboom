# 🚀 Fly.io Deployment Guide (FREE - No Credit Card Required)

## 📋 Prerequisites

1. **GitHub Account** - Your code is already there
2. **Fly.io Account** - Free signup, no credit card needed for basic tier
3. **15 minutes** - Setup time

## 🎯 Step-by-Step Fly.io Deployment

### Step 1: Create Fly.io Account

1. **Go to Fly.io**
   - Visit [fly.io](https://fly.io)
   - Click "Get Started"

2. **Sign Up**
   - Choose "Sign up with GitHub"
   - Authorize Fly.io to access your repositories
   - **No credit card required for basic tier!**

### Step 2: Install Fly CLI

```bash
# macOS (using Homebrew)
brew install flyctl

# Or download from https://fly.io/docs/hands-on/install-flyctl/
```

### Step 3: Login to Fly.io

```bash
fly auth login
```

### Step 4: Deploy Your Game

1. **Clone your repository** (if not already done):
```bash
git clone https://github.com/Jetsubtc/kaboom.git
cd kaboom
```

2. **Deploy with Fly.io**:
```bash
fly launch
```

3. **Follow the prompts**:
   - **App name:** `kaboom-game` (or press Enter for auto-generated)
   - **Region:** Choose closest to your users (e.g., `iad` for US East)
   - **Would you like to deploy now?** `Y`

### Step 5: Configure Environment Variables

```bash
fly secrets set NODE_ENV=production
fly secrets set PORT=8080
```

### Step 6: Scale Your App

```bash
# Scale to 1 instance (free tier)
fly scale count 1

# Check your app status
fly status
```

## 🎮 Testing Your Deployment

### Health Check
```
https://kaboom-game.fly.dev/api/health
```

### Game URL
```
https://kaboom-game.fly.dev/
```

### Admin Dashboard
```
https://kaboom-game.fly.dev/admin-dashboard.html
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
- SQLite works on Fly.io
- Data persists between deployments
- Automatic backups included

### Free Tier Limitations
- **Fly.io Free:** 3 shared-cpu VMs
- **Memory:** 256MB per VM
- **Storage:** 3GB total
- **Bandwidth:** 160GB outbound/month

### Custom Domain (Optional)
- Fly.io supports custom domains
- SSL certificates included
- Professional URLs available

## 🔄 Continuous Deployment

### Manual Deployment
```bash
fly deploy
```

### Automatic Deployment
- Connect GitHub repository
- Auto-deploy on push to main branch

## 📊 Monitoring

### Fly.io Dashboard
- Real-time logs: `fly logs`
- Performance metrics
- Error tracking
- Uptime monitoring

### Health Endpoints
- `/api/health` - Server status
- `/api/analytics/dashboard` - Game analytics

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check build logs
   fly logs
   
   # Rebuild and deploy
   fly deploy
   ```

2. **CORS Errors**
   - Update allowed origins in `server.js`
   - Make sure your Fly.io URL is correct
   - Check browser console for errors

3. **Database Issues**
   ```bash
   # Check if app is running
   fly status
   
   # View logs
   fly logs
   ```

4. **Port Issues**
   - Make sure `server.js` uses `process.env.PORT`
   - Check `fly.toml` configuration

### Useful Commands

```bash
# Check app status
fly status

# View logs
fly logs

# SSH into your app
fly ssh console

# Scale your app
fly scale count 1

# Restart your app
fly apps restart kaboom-game

# Check app info
fly info
```

### Getting Help

- **Fly.io Docs:** https://fly.io/docs
- **Fly.io Support:** Available in dashboard
- **GitHub Issues:** For code-related problems

## 🎉 Success!

After deployment, your game will be:
- ✅ **Live and accessible** worldwide
- ✅ **Real-time data** working
- ✅ **Recharge system** functional
- ✅ **Admin dashboard** available
- ✅ **All features** operational

**Your game URL:** `https://kaboom-game.fly.dev`

## 🔧 Advanced Configuration

### Custom Domain
```bash
# Add custom domain
fly certs add yourdomain.com
```

### Environment Variables
```bash
# Set multiple environment variables
fly secrets set NODE_ENV=production PORT=8080
```

### Scaling
```bash
# Scale to multiple instances (paid tier)
fly scale count 3

# Scale memory
fly scale memory 512
```

---

**Share your game with the world!** 🎮✨

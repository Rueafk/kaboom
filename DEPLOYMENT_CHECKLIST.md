# ✅ GitHub + Render Deployment Checklist

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All files committed to git
- [ ] `package.json` has correct scripts
- [ ] `render.yaml` configured properly
- [ ] `.gitignore` excludes unnecessary files
- [ ] `server.js` has production environment support
- [ ] CORS origins configured for Render

### ✅ Testing
- [ ] Local server starts without errors
- [ ] All API endpoints working
- [ ] Database tables created successfully
- [ ] Recharge system functioning
- [ ] Admin dashboard accessible
- [ ] Health check endpoint responding

### ✅ Configuration Files
- [ ] `render.yaml` - Render deployment config
- [ ] `package.json` - Dependencies and scripts
- [ ] `.gitignore` - Excludes node_modules, logs, etc.
- [ ] `server.js` - Production-ready server
- [ ] `README.md` - Updated documentation

## 🚀 Deployment Steps

### Step 1: GitHub Setup
```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Ready for Render deployment"

# Create GitHub repository (don't initialize with README)
# Then push
git remote add origin https://github.com/YOUR_USERNAME/kaboom-game.git
git branch -M main
git push -u origin main
```

### Step 2: Render Deployment
1. **Go to Render.com**
   - Sign up with GitHub account
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select your GitHub repository
   - Choose `main` branch

3. **Configure Service**
   - **Name:** `kaboom-game-server`
   - **Environment:** `Node`
   - **Region:** Choose closest to users
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

4. **Environment Variables**
   - `NODE_ENV` = `production`
   - `PORT` = `10000`

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)

### Step 3: Update CORS
After deployment, update `server.js`:
```javascript
const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://kaboom-game-server.onrender.com'] // Your actual URL
    : ['http://localhost:3000'];
```

Then push changes:
```bash
git add server.js
git commit -m "Update CORS for production"
git push
```

## 🧪 Post-Deployment Testing

### ✅ Health Check
```bash
curl https://kaboom-game-server.onrender.com/api/health
```
**Expected:** `{"status":"healthy","database":"connected"}`

### ✅ Game Access
- [ ] Game loads at: `https://kaboom-game-server.onrender.com/`
- [ ] No console errors
- [ ] Wallet connection works
- [ ] Recharge system functional

### ✅ Admin Dashboard
- [ ] Accessible at: `https://kaboom-game-server.onrender.com/admin-dashboard.html`
- [ ] Player data visible
- [ ] Analytics working
- [ ] No authentication errors

### ✅ API Endpoints
- [ ] `/api/health` - Server status
- [ ] `/api/players` - Player list
- [ ] `/api/recharge/:wallet` - Recharge status
- [ ] `/api/analytics/dashboard` - Analytics

## 🔧 Troubleshooting

### Build Fails
- [ ] Check Node.js version (>=16)
- [ ] Verify `package.json` scripts
- [ ] Check build logs in Render dashboard

### CORS Errors
- [ ] Update allowed origins in `server.js`
- [ ] Verify your Render URL is correct
- [ ] Check browser console for errors

### Database Issues
- [ ] SQLite should work on Render
- [ ] Check if database file is created
- [ ] Monitor logs for database errors

### Port Issues
- [ ] Render auto-assigns PORT
- [ ] Ensure `server.js` uses `process.env.PORT`

## 📊 Monitoring

### Render Dashboard
- [ ] Service status: "Live"
- [ ] No error logs
- [ ] Performance metrics normal
- [ ] Uptime monitoring active

### Health Monitoring
- [ ] `/api/health` responding
- [ ] Database connected
- [ ] All systems operational

## 🎉 Success Criteria

### ✅ Game Features Working
- [ ] Wallet connection functional
- [ ] Recharge system operational
- [ ] Player data persistent
- [ ] Admin dashboard accessible
- [ ] All API endpoints responding

### ✅ Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] No 500 errors
- [ ] Database queries fast

### ✅ Security
- [ ] CORS properly configured
- [ ] No sensitive data exposed
- [ ] API endpoints secured
- [ ] Session validation working

## 🔄 Maintenance

### Regular Checks
- [ ] Monitor Render dashboard daily
- [ ] Check health endpoint weekly
- [ ] Review error logs monthly
- [ ] Update dependencies quarterly

### Backup Strategy
- [ ] Database backups (Render handles this)
- [ ] Code version control (GitHub)
- [ ] Configuration backups
- [ ] Documentation updates

## 📞 Support Resources

- **Render Docs:** https://render.com/docs
- **GitHub Issues:** For code problems
- **Render Support:** Available in dashboard
- **Community:** Discord/Forums

---

**Your game is ready for the world!** 🎮✨

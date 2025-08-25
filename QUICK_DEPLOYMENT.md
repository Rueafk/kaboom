# 🚀 Quick Deployment Guide - 100% Free Options

## 🎯 **Option 1: Vercel (RECOMMENDED - 5 minutes)**

### **Step 1: Go to Vercel**
1. Visit [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. **No credit card required!**

### **Step 2: Deploy Your Game**
1. Click "New Project"
2. Select "Import Git Repository"
3. Find and select `Jetsubtc/kaboom`
4. Click "Deploy"

### **Step 3: Get Your URL**
- **Game:** `https://kaboom-game.vercel.app`
- **Admin Dashboard:** `https://kaboom-game.vercel.app/admin-dashboard.html`

---

## 🎯 **Option 2: Netlify (BACKUP - 10 minutes)**

### **Step 1: Go to Netlify**
1. Visit [netlify.com](https://netlify.com)
2. Click "Sign Up"
3. Choose "Sign up with GitHub"
4. **No credit card required!**

### **Step 2: Deploy Your Game**
1. Click "New site from Git"
2. Choose "GitHub"
3. Select `Jetsubtc/kaboom`
4. Click "Deploy site"

### **Step 3: Get Your URL**
- **Game:** `https://kaboom-game.netlify.app`
- **Admin Dashboard:** `https://kaboom-game.netlify.app/admin-dashboard.html`

---

## 🎯 **Option 3: GitHub Pages (SIMPLE - 2 minutes)**

### **Step 1: Enable GitHub Pages**
1. Go to your repository: https://github.com/Jetsubtc/kaboom
2. Click "Settings"
3. Scroll to "Pages"
4. Select "Deploy from a branch"
5. Choose "main" branch
6. Click "Save"

### **Step 2: Get Your URL**
- **Game:** `https://jetsubtc.github.io/kaboom/`
- **Note:** Frontend only (no backend features)

---

## 🎮 **What Will Work After Deployment**

### ✅ **Vercel/Netlify (Full Features)**
- Wallet connection
- Real-time recharge system
- Player profiles
- Admin dashboard
- All backend features

### ⚠️ **GitHub Pages (Frontend Only)**
- Game interface
- No wallet connection
- No recharge system
- No admin dashboard

---

## 🚨 **If You Get CORS Errors**

After deployment, update `server.js` with your actual URL:

```javascript
const allowedOrigins = NODE_ENV === 'production' 
    ? ['https://your-actual-url.vercel.app'] // Replace with your actual URL
    : ['http://localhost:3000'];
```

Then commit and push:
```bash
git add server.js
git commit -m "Update CORS for production"
git push
```

---

## 🎉 **Success!**

Your game will be live and accessible worldwide! 🎮✨

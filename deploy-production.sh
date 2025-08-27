#!/bin/bash

# 🌍 PRODUCTION DEPLOYMENT SCRIPT FOR WORLDWIDE ACCESS
# This script deploys your Kaboom game with blockchain integration worldwide

set -e

echo "🚀 Starting Production Deployment for Worldwide Access..."

# ========================================
# PRE-DEPLOYMENT CHECKS
# ========================================
echo "🔍 Running pre-deployment checks..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy production.env to .env and configure it."
    exit 1
fi

# Check if admin private key is set
if grep -q "YOUR_PRODUCTION_PRIVATE_KEY_HERE" .env; then
    echo "❌ Please set your production admin private key in .env"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# ========================================
# PRODUCTION WALLET SETUP
# ========================================
echo "🔑 Setting up production wallet..."

# Generate production wallet if not exists
if ! grep -q "ADMIN_PRIVATE_KEY=" .env; then
    echo "🔑 Generating new production wallet..."
    WALLET_OUTPUT=$(node -e "
    const { Keypair } = require('@solana/web3.js');
    const bs58 = require('bs58');
    const wallet = Keypair.generate();
    console.log('Public Key:', wallet.publicKey.toString());
    console.log('Private Key (base58):', bs58.encode(wallet.secretKey));
    ")
    
    PUBLIC_KEY=$(echo "$WALLET_OUTPUT" | grep "Public Key:" | cut -d' ' -f3)
    PRIVATE_KEY=$(echo "$WALLET_OUTPUT" | grep "Private Key (base58):" | cut -d' ' -f3)
    
    echo "🔑 Generated Production Wallet:"
    echo "   Public Key: $PUBLIC_KEY"
    echo "   Private Key: $PRIVATE_KEY"
    echo ""
    echo "⚠️  IMPORTANT: Fund this wallet with real SOL for production!"
    echo "   You can buy SOL from exchanges like Coinbase, Binance, etc."
    echo ""
    
    # Update .env with new private key
    sed -i '' "s/ADMIN_PRIVATE_KEY=.*/ADMIN_PRIVATE_KEY=$PRIVATE_KEY/" .env
fi

# ========================================
# DATABASE SETUP
# ========================================
echo "🗄️ Setting up production database..."

# Create production database
if [ ! -f "kaboom_game_production.db" ]; then
    echo "📊 Initializing production database..."
    node -e "
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./kaboom_game_production.db');
    console.log('✅ Production database created');
    "
fi

# ========================================
# SECURITY CHECKS
# ========================================
echo "🔒 Running security checks..."

# Check file permissions
chmod 600 .env
chmod 600 kaboom_game_production.db

# ========================================
# DEPLOYMENT OPTIONS
# ========================================
echo ""
echo "🌍 Choose your deployment platform:"
echo "1) Koyeb (Recommended - Free tier available)"
echo "2) Heroku"
echo "3) Railway"
echo "4) DigitalOcean"
echo "5) AWS"
echo "6) Local production server"
echo ""

read -p "Enter your choice (1-6): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1)
        echo "🚀 Deploying to Koyeb..."
        deploy_koyeb
        ;;
    2)
        echo "🚀 Deploying to Heroku..."
        deploy_heroku
        ;;
    3)
        echo "🚀 Deploying to Railway..."
        deploy_railway
        ;;
    4)
        echo "🚀 Deploying to DigitalOcean..."
        deploy_digitalocean
        ;;
    5)
        echo "🚀 Deploying to AWS..."
        deploy_aws
        ;;
    6)
        echo "🚀 Starting local production server..."
        deploy_local
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# ========================================
# DEPLOYMENT FUNCTIONS
# ========================================

deploy_koyeb() {
    echo "📦 Preparing Koyeb deployment..."
    
    # Create koyeb.yaml if not exists
    if [ ! -f "koyeb.yaml" ]; then
        cat > koyeb.yaml << EOF
name: kaboom-game
service:
  name: kaboom-game
  type: web
  env:
    - key: NODE_ENV
      value: production
    - key: ENABLE_BLOCKCHAIN
      value: "true"
    - key: SOLANA_RPC_URL
      value: "https://api.mainnet-beta.solana.com"
    - key: ADMIN_PRIVATE_KEY
      secret: admin-private-key
  ports:
    - port: 8000
      protocol: http
  routes:
    - path: /
      protocol: http
  scale:
    min: 1
    max: 10
  resources:
    cpu: 0.5
    memory: 512Mi
  healthcheck:
    path: /api/health
    port: 8000
    interval: 30s
    timeout: 10s
    retries: 3
EOF
    fi
    
    echo "🚀 Deploying to Koyeb..."
    echo "   Run: koyeb app init kaboom-game --docker"
    echo "   Then: koyeb app deploy kaboom-game"
    echo ""
    echo "🔗 Your game will be available at: https://kaboom-game-{username}.koyeb.app"
}

deploy_heroku() {
    echo "📦 Preparing Heroku deployment..."
    
    # Create Procfile if not exists
    if [ ! -f "Procfile" ]; then
        echo "web: node server.js" > Procfile
    fi
    
    echo "🚀 Deploying to Heroku..."
    echo "   Run: heroku create your-kaboom-game"
    echo "   Then: git push heroku main"
    echo ""
    echo "🔗 Your game will be available at: https://your-kaboom-game.herokuapp.com"
}

deploy_railway() {
    echo "📦 Preparing Railway deployment..."
    
    echo "🚀 Deploying to Railway..."
    echo "   Run: railway login"
    echo "   Then: railway up"
    echo ""
    echo "🔗 Your game will be available at: https://your-app.railway.app"
}

deploy_digitalocean() {
    echo "📦 Preparing DigitalOcean deployment..."
    
    echo "🚀 Deploying to DigitalOcean App Platform..."
    echo "   Create a new app in DigitalOcean dashboard"
    echo "   Connect your GitHub repository"
    echo "   Set environment variables"
    echo ""
    echo "🔗 Your game will be available at: https://your-app.ondigitalocean.app"
}

deploy_aws() {
    echo "📦 Preparing AWS deployment..."
    
    echo "🚀 Deploying to AWS..."
    echo "   Use AWS Elastic Beanstalk or ECS"
    echo "   Set up environment variables"
    echo "   Configure load balancer"
    echo ""
    echo "🔗 Your game will be available at: https://your-domain.com"
}

deploy_local() {
    echo "🚀 Starting local production server..."
    
    # Set production environment
    export NODE_ENV=production
    export ENABLE_BLOCKCHAIN=true
    
    echo "🌍 Starting production server on port 8000..."
    echo "🔗 Your game will be available at: http://localhost:8000"
    echo "🌐 For worldwide access, use ngrok or similar service"
    echo ""
    echo "📦 Install ngrok: npm install -g ngrok"
    echo "🌐 Expose to internet: ngrok http 8000"
    echo ""
    
    npm start
}

echo ""
echo "✅ Production deployment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Fund your production wallet with real SOL"
echo "2. Deploy to your chosen platform"
echo "3. Configure your domain name"
echo "4. Set up monitoring and alerts"
echo "5. Test with real players worldwide!"
echo ""
echo "🌍 Your Kaboom game will be accessible worldwide with full blockchain integration!"

#!/bin/bash

echo "🚀 Kaboom Game Deployment Setup"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database files (keep for development, but be aware of persistence)
*.db
*.sqlite
*.sqlite3
EOF
    echo "✅ .gitignore created"
else
    echo "✅ .gitignore already exists"
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Check if server.js exists
if [ -f "server.js" ]; then
    echo "✅ server.js found"
else
    echo "❌ server.js not found!"
    exit 1
fi

# Test the server
echo "🧪 Testing server startup..."
node server.js &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server starts successfully"
    kill $SERVER_PID
    sleep 1
else
    echo "❌ Server failed to start"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Your project is ready for deployment."
echo ""
echo "📋 Next steps:"
echo "1. Create a GitHub repository"
echo "2. Push your code: git add . && git commit -m 'Initial commit' && git push"
echo "3. Choose a hosting platform (Railway/Render/Heroku)"
echo "4. Follow the deployment guide in DEPLOYMENT.md"
echo ""
echo "🔗 Quick links:"
echo "- Railway: https://railway.app"
echo "- Render: https://render.com"
echo "- Heroku: https://heroku.com"
echo ""
echo "📖 Full deployment guide: DEPLOYMENT.md"

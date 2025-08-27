#!/bin/bash

# Kaboom Admin Dashboard Deployment Script

set -e

echo "🚀 Starting Kaboom Admin Dashboard deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp env.example .env.local
    echo "📝 Please edit .env.local with your configuration before continuing."
    echo "   Required variables:"
    echo "   - NEXT_PUBLIC_API_BASE (your backend API URL)"
    echo "   - ADMIN_USERNAME (admin username)"
    echo "   - ADMIN_PASSWORD (admin password)"
    read -p "Press Enter after editing .env.local..."
fi

# Build the application
echo "🔨 Building the application..."
npm run build

echo "✅ Build completed successfully!"

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
else
    echo "📋 Vercel CLI not found. To deploy to Vercel:"
    echo "   1. Install Vercel CLI: npm i -g vercel"
    echo "   2. Run: vercel --prod"
fi

# Check if Koyeb CLI is installed
if command -v koyeb &> /dev/null; then
    echo "🚀 Deploying to Koyeb..."
    koyeb app init kaboom-admin-dashboard --docker
else
    echo "📋 Koyeb CLI not found. To deploy to Koyeb:"
    echo "   1. Install Koyeb CLI: curl -fsSL https://cli.koyeb.com/install.sh | bash"
    echo "   2. Run: koyeb app init kaboom-admin-dashboard --docker"
fi

echo "🎉 Deployment script completed!"
echo ""
echo "📊 Next steps:"
echo "   1. Set environment variables in your deployment platform"
echo "   2. Configure your backend API URL"
echo "   3. Test the admin dashboard"
echo "   4. Change default admin credentials"
echo ""
echo "🔗 Dashboard URL will be provided by your deployment platform"

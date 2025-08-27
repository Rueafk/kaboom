#!/bin/bash

# Kaboom Game - Quick Start Script
# This script sets up and runs the complete Kaboom game system

set -e

echo "🎮 Welcome to Kaboom Game Setup!"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "   Please update Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install main server dependencies
echo ""
echo "📦 Installing main server dependencies..."
npm install

# Set up main server environment
if [ ! -f .env ]; then
    echo ""
    echo "🔧 Setting up main server environment..."
    cp env-template.txt .env
    echo "✅ Environment file created. Edit .env if needed."
fi

# Set up admin dashboard
echo ""
echo "📊 Setting up admin dashboard..."
cd admin-dashboard

# Install admin dashboard dependencies
echo "📦 Installing admin dashboard dependencies..."
npm install

# Set up admin dashboard environment
if [ ! -f .env.local ]; then
    echo "🔧 Setting up admin dashboard environment..."
    cp env.example .env.local
    echo "✅ Admin environment file created."
fi

cd ..

# Start the main server
echo ""
echo "🚀 Starting main game server..."
echo "   This will start the server in the background."
echo "   You can access:"
echo "   - Game: http://localhost:8000"
echo "   - Admin Dashboard: http://localhost:8000/admin"
echo "   - Health Check: http://localhost:8000/api/health"
echo ""

# Start server in background
npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Main server is running!"
else
    echo "❌ Main server failed to start. Check logs above."
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Start admin dashboard
echo ""
echo "📊 Starting admin dashboard..."
echo "   This will start the dashboard in the background."
echo "   You can access: http://localhost:3000"
echo ""

cd admin-dashboard
npm run dev &
DASHBOARD_PID=$!

cd ..

# Wait a moment for dashboard to start
sleep 5

# Check if dashboard is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Admin dashboard is running!"
else
    echo "❌ Admin dashboard failed to start. Check logs above."
    kill $DASHBOARD_PID 2>/dev/null || true
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 Kaboom Game is now running!"
echo "================================"
echo ""
echo "🌐 Access Points:"
echo "   🎮 Game:          http://localhost:8000"
echo "   📊 Admin Dashboard: http://localhost:3000"
echo "   🔧 Server Admin:   http://localhost:8000/admin"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: kaboom2024"
echo ""
echo "📋 Useful Commands:"
echo "   View server logs:    tail -f server.log"
echo "   Stop server:         pkill -f 'node server.js'"
echo "   Stop dashboard:      pkill -f 'next dev'"
echo "   Check health:        curl http://localhost:8000/api/health"
echo ""
echo "⚠️  Important Notes:"
echo "   - Change default admin credentials in production"
echo "   - The server will continue running in the background"
echo "   - Use Ctrl+C to stop this script (servers will continue running)"
echo "   - To stop all services: pkill -f 'node'"
echo ""

# Function to handle script termination
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $SERVER_PID 2>/dev/null || true
    kill $DASHBOARD_PID 2>/dev/null || true
    echo "✅ Services stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🔄 Services are running. Press Ctrl+C to stop this script."
echo "   (The servers will continue running in the background)"
echo ""

# Keep script running
while true; do
    sleep 1
done

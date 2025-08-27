#!/bin/bash

echo "🚀 Starting Kaboom Game Server..."

# Check if we're in production
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production environment detected"
    echo "🔧 Node version: $(node --version)"
    echo "📦 NPM version: $(npm --version)"
    echo "📁 Current directory: $(pwd)"
    echo "📋 Files in current directory:"
    ls -la
fi

# Start the server
echo "🎯 Starting server on port $PORT..."
npm start

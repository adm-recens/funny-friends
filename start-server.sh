#!/bin/bash

# Start Server Script
echo "🖥️  Starting Teen Patti Server..."

# Check if Docker services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "🐳 Starting Docker services..."
    docker-compose up -d
    sleep 5
fi

cd server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi

# Run database migrations if needed
echo "🗄️  Running database migrations..."
npx prisma db push

# Start the server
echo "🚀 Starting server on http://localhost:3000"
npm run dev
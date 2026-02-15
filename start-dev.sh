#!/bin/bash

# Teen Patti Local Development Setup Script
# This script sets up and starts the entire local development environment

set -e

echo "🎮 Teen Patti Local Development Setup"
echo "====================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ All prerequisites are installed!"

# Check if ports are available
echo "📡 Checking port availability..."

if port_in_use 3000; then
    echo "⚠️  Port 3000 is already in use. Please stop the service using this port."
    echo "   You can find the process with: lsof -i :3000"
    exit 1
fi

if port_in_use 5173; then
    echo "⚠️  Port 5173 is already in use. Please stop the service using this port."
    echo "   You can find the process with: lsof -i :5173"
    exit 1
fi

if port_in_use 5432; then
    echo "⚠️  Port 5432 is already in use. Please stop the service using this port."
    echo "   You can find the process with: lsof -i :5432"
    exit 1
fi

echo "✅ All required ports are available!"

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
echo "🔍 Checking database connection..."
until docker-compose exec postgres pg_isready -U teen_patti_user -d teen_patti_local; do
    echo "   Waiting for database..."
    sleep 2
done

echo "✅ Database is ready!"

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma db push

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ..

echo "🎉 Setup complete!"
echo ""
echo "🚀 Starting development servers..."
echo ""

# Create a new terminal window or tab for the server
echo "🖥️  Starting server in background..."
cd server
npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start the client
echo "🌐 Starting client..."
cd client
npm run dev &
CLIENT_PID=$!

echo ""
echo "✅ Development servers are starting!"
echo ""
echo "📍 Access points:"
echo "   • Client: http://localhost:5173"
echo "   • Server: http://localhost:3000"
echo "   • Database: localhost:5432"
echo ""
echo "🛑 To stop all services, press Ctrl+C or run: docker-compose down"
echo ""

# Wait for user interrupt
trap "echo '🛑 Stopping servers...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; docker-compose down; exit" INT

# Keep the script running
wait
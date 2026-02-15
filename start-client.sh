#!/bin/bash

# Start Client Script
echo "🌐 Starting Teen Patti Client..."

cd client

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing client dependencies..."
    npm install
fi

# Start the client
echo "🚀 Starting client on http://localhost:5173"
npm run dev
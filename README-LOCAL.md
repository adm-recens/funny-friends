# Local Development Setup Guide

This guide will help you set up and run the Teen Patti application locally for development and testing before deploying changes to the production Render environment.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Docker & Docker Compose** (for PostgreSQL & Redis)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows/Mac)
   - [Docker Engine](https://docs.docker.com/engine/install/) (Linux)

2. **Node.js** (version 18 or higher)
   - [Node.js Official Website](https://nodejs.org/)
   - Verify with: `node --version` and `npm --version`

3. **Git**
   - [Git Official Website](https://git-scm.com/)

### One-Command Setup

#### Windows
```bash
start-dev.bat
```

#### macOS/Linux
```bash
chmod +x start-dev.sh
./start-dev.sh
```

This will:
- ✅ Check all prerequisites
- 🐳 Start PostgreSQL and Redis containers
- 📦 Install all dependencies
- 🗄️ Run database migrations
- 🚀 Start both client and server

### Manual Setup

If you prefer manual setup or encounter issues:

#### 1. Start Database Services
```bash
docker-compose up -d
```

#### 2. Install Server Dependencies
```bash
cd server
npm install
npx prisma db push
```

#### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

#### 4. Start Development Servers
```bash
# Terminal 1 - Start Server
cd server
npm run dev

# Terminal 2 - Start Client
cd client
npm run dev
```

## 🌐 Access Points

Once running, access the application at:

- **Client Application**: http://localhost:5173
- **Server API**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: `npm run db:studio` (in server directory)

## 📁 Project Structure

```
teen-patti-app/
├── client/                 # React frontend
│   ├── src/
│   ├── .env.local          # Client environment variables
│   └── package.json
├── server/                 # Node.js backend
│   ├── game/              # Game logic
│   ├── prisma/            # Database schema
│   ├── .env.local         # Server environment variables
│   └── package.json
├── database/              # Database initialization
├── docker-compose.yml      # Docker services
├── start-dev.bat         # Windows setup script
├── start-dev.sh          # macOS/Linux setup script
├── start-server.sh       # Server-only script
├── start-client.sh       # Client-only script
├── .env.local            # Shared environment variables
└── README-LOCAL.md       # This file
```

## 🔧 Configuration

### Environment Variables

The local environment uses these configuration files:

- `.env.local` - Shared environment variables
- `client/.env.local` - Client-specific variables
- `server/.env.local` - Server-specific variables (auto-loaded from root)

#### Database Configuration
```bash
DATABASE_URL="postgresql://teen_patti_user:teen_patti_password@localhost:5432/teen_patti_local"
```

#### Server Configuration
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-for-local-development-only
CLIENT_URL=http://localhost:5173
```

#### Client Configuration
```bash
VITE_BACKEND_URL=http://localhost:3000
```

## 🎮 Development Workflow

### 1. Making Changes

- **Frontend Changes**: Edit files in `client/src/`
- **Backend Changes**: Edit files in `server/`
- **Database Changes**: Edit `server/prisma/schema.prisma`

### 2. Database Changes

When modifying the Prisma schema:

```bash
cd server
npx prisma db push    # Apply changes to local DB
npx prisma studio     # View database data
```

### 3. Testing Features

1. **User Registration**: First user becomes admin (username: admin, password: admin123)
2. **Create Session**: Use SessionSetup page to create game sessions
3. **Join Game**: Multiple browser tabs can simulate different players
4. **Spectator Mode**: Use guest access to test spectator features

### 4. Debugging

#### Server Debugging
- Server logs appear in the terminal
- Database queries are logged (in development mode)
- Socket.io events are logged

#### Client Debugging
- Open browser DevTools (F12)
- Check Console tab for client logs
- Network tab shows API calls and WebSocket connections

## 🛠️ Development Scripts

### Server Scripts (in `server/`)
```bash
npm run dev        # Start development server with auto-reload
npm run start      # Start production server
npm run db:push    # Apply schema changes to database
npm run db:migrate # Run database migrations
npm run db:studio  # Open Prisma Studio
```

### Client Scripts (in `client/`)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:local  # Build for local environment
npm run preview      # Preview production build
```

### Utility Scripts (root)
```bash
./start-dev.sh      # Start everything (macOS/Linux)
start-dev.bat       # Start everything (Windows)
./start-server.sh    # Start server only
./start-client.sh    # Start client only
```

## 🐳 Docker Services

### PostgreSQL
- **Container**: `teen-patti-db`
- **Port**: 5432
- **Database**: `teen_patti_local`
- **User**: `teen_patti_user`
- **Password**: `teen_patti_password`

### Redis
- **Container**: `teen-patti-redis`
- **Port**: 6379
- **Usage**: Session management (for future scaling)

## 🔍 Common Issues & Solutions

### Port Conflicts
If you encounter port conflicts:

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Docker Issues
```bash
# Reset Docker containers
docker-compose down
docker system prune -f
docker-compose up -d
```

### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U teen_patti_user

# Reset database
docker-compose down
docker volume rm teen-patti-app_postgres_data
docker-compose up -d
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🧪 Testing Before Production

Before pushing changes to Render:

### 1. Functionality Checklist
- [ ] User login/logout works
- [ ] Session creation works
- [ ] Game mechanics work (bet, fold, show)
- [ ] Real-time updates work
- [ ] Spectator mode works
- [ ] Admin dashboard works

### 2. Database Tests
- [ ] Data persistence works
- [ ] User management works
- [ ] Game history saves correctly

### 3. Performance Tests
- [ ] Socket connections stable
- [ ] UI responsive
- [ ] No memory leaks

### 4. Browser Compatibility
- [ ] Chrome/Chromium works
- [ ] Firefox works
- [ ] Safari works (if available)

## 🚀 Deploying to Production

Once local testing is complete:

### 1. Commit Changes
```bash
git add .
git commit -m "Local testing complete"
git push origin main
```

### 2. Update Production Environment Variables
Ensure Render has the correct environment variables (different from local ones).

### 3. Monitor Deployment
Check Render dashboard for successful deployment.

### 4. Test Production
Test on the live environment to ensure everything works.

## 📞 Support

If you encounter issues:

1. **Check logs**: Both client and server logs for error messages
2. **Verify environment**: Ensure all environment variables are set correctly
3. **Check Docker**: Ensure containers are running properly
4. **Network issues**: Verify firewall isn't blocking ports

## 🔄 Syncing Production Data

If you need to sync production data to local for testing:

```bash
# Export from production (Run on production server)
pg_dump -h localhost -U username teen_patti_production > production.sql

# Import to local (Run locally)
docker-compose exec -T postgres psql -U teen_patti_user -d teen_patti_local < production.sql
```

## 🎉 Happy Coding!

You now have a fully functional local development environment. Make your changes, test thoroughly, and then deploy to production with confidence!
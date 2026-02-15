@echo off
REM Teen Patti Local Development Setup Script for Windows
REM This script sets up and starts the entire local development environment

echo Teen Patti Local Development Setup
echo =====================================

REM Function to check if a command exists
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo All prerequisites are installed!

REM Start Docker services
echo Starting Docker services (PostgreSQL and Redis)...
docker-compose up -d

REM Wait for database to be ready
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Install server dependencies
echo Installing server dependencies...
cd server
if not exist node_modules (
    npm install
)

REM Run database migrations
echo Running database migrations...
npx prisma db push

REM Install client dependencies
echo Installing client dependencies...
cd ..\client
if not exist node_modules (
    npm install
)

cd ..

echo Setup complete!
echo.
echo Starting development servers...
echo.

REM Start server
echo Starting server...
start "Teen Patti Server" cmd /k "cd server && npm run dev"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start client
echo Starting client...
start "Teen Patti Client" cmd /k "cd client && npm run dev"

echo.
echo Development servers are starting!
echo.
echo Access points:
echo    Client: http://localhost:5173
echo    Server: http://localhost:3000
echo    Database: localhost:5432
echo.
echo To stop all services, close the terminal windows and run: docker-compose down
echo.
echo Press any key to continue...
pause >nul
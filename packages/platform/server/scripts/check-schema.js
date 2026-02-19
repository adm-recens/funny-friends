// Startup script to ensure database schema is up to date
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');

async function main() {
  console.log('[STARTUP] Checking database schema...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('[STARTUP] Database connected');
    
    // Try a simple query to check if score column exists
    try {
      await prisma.$queryRaw`SELECT score FROM "Player" LIMIT 1`;
      console.log('[STARTUP] Database schema is up to date');
    } catch (e) {
      // Column doesn't exist, need to push schema
      console.log('[STARTUP] Database schema outdated, pushing...');
      
      const push = spawn('npx', ['prisma', 'db', 'push'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
      });
      
      push.on('close', (code) => {
        if (code === 0) {
          console.log('[STARTUP] Schema pushed successfully');
        } else {
          console.error('[STARTUP] Schema push failed');
        }
      });
    }
  } catch (e) {
    console.error('[STARTUP] Database connection failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

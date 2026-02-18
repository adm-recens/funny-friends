// Database Connection Module
// Centralizes Prisma Client instantiation
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

let prisma;

if (!prisma) {
    prisma = new PrismaClient({
        // Prisma 5.x handles connection pooling and SSL automatically via DATABASE_URL
        // For production (Render), ensure DATABASE_URL includes ?sslmode=require
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
}

module.exports = prisma;

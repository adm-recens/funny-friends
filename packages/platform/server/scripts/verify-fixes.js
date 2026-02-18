const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { spawn } = require('child_process');
// const fetch = require('node-fetch'); // Native fetch in Node 18+

// Load env
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const prisma = new PrismaClient();
const PORT = 3001; // Use different port to avoid conflict if running

async function main() {
    console.log('--- Starting Verification ---');

    // 1. Setup DB Data
    console.log('1. Setting up Test Admin & GameType...');
    const testAdminUser = 'verify_admin_' + Date.now();
    const testAdminPass = 'password123';

    // Create GameType if not exists
    let gameType = await prisma.gameType.findFirst();
    if (!gameType) {
        gameType = await prisma.gameType.create({
            data: {
                code: 'teen-patti',
                name: 'Teen Patti',
                icon: 'cards',
                color: 'blue',
                maxPlayers: 6,
                minPlayers: 2
            }
        });
    }
    console.log('   GameType ID:', gameType.id);

    // Create Admin
    // Note: we need to import hashPassword or just allow it if our logic is robust?
    // server.js uses bcrypt. checking auth.controller.js...
    // We can't easily import hashPassword from server.js.
    // We'll trust the API to handle login if we create via API? No, we need admin first.
    // Let's create admin directly in DB with a known hash (bcrypt 'password123' = $2a$10$...)
    // Or just use the setup endpoint!

    // Actually, let's just start the server and use the setup endpoint if needed, OR
    // finding an existing admin.
    // Simplest: Create Admin via Prisma with a simpler password mechanism? No, must match bcrypt.
    // I'll grab bcryptjs
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(testAdminPass, 10);

    const admin = await prisma.user.create({
        data: {
            username: testAdminUser,
            password: hashedPassword,
            role: 'ADMIN'
        }
    });
    console.log('   Admin Created:', admin.username);

    // 2. Start Server
    console.log('2. Starting Server...');
    const serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT }
    });

    serverProcess.stdout.on('data', (data) => {
        // console.log(`[Server]: ${data}`);
        if (data.toString().includes('Server running')) {
            console.log('   Server is ready.');
            runTests(admin, testAdminPass, gameType.id);
        }
    });

    serverProcess.stderr.on('data', (data) => console.error(`[Server Error]: ${data}`));

    async function runTests(admin, password, gameTypeId) {
        try {
            const baseUrl = `http://localhost:${PORT}`;

            // 3. Login as Admin
            console.log('3. Logging in as Admin...');
            const loginRes = await fetch(`${baseUrl}/api/v2/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: admin.username, password })
            });

            if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
            const loginData = await loginRes.json();
            const cookie = loginRes.headers.get('set-cookie');
            console.log('   Login Successful. Token received.');

            // 4. Create Operator with Permissions
            console.log('4. Creating Operator with Allowed Games...');
            const newOpUser = 'op_' + Date.now();
            const createRes = await fetch(`${baseUrl}/api/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie
                },
                body: JSON.stringify({
                    username: newOpUser,
                    password: 'password123',
                    role: 'OPERATOR',
                    allowedGames: [gameTypeId]
                })
            });

            const createJson = await createRes.json();
            console.log(`   Response (${createRes.status}):`, createJson);

            if (createRes.status !== 201) throw new Error('Failed to create user');

            // 5. Verify Permissions in DB
            console.log('5. Verifying Permissions in DB...');
            const permissions = await prisma.userGamePermission.findMany({
                where: { userId: createJson.user.id }
            });

            console.log('   Permissions found:', permissions.length);
            if (permissions.length === 1 && permissions[0].gameTypeId === gameTypeId) {
                console.log('✅ verification PASSED: Permission correctly assigned.');
            } else {
                console.error('❌ verification FAILED: Permissions mismatch.');
            }

        } catch (e) {
            console.error('❌ Test Failed:', e);
        } finally {
            console.log('--- Cleaning Up ---');
            serverProcess.kill();
            await prisma.user.deleteMany({ where: { username: { in: [testAdminUser, testAdminUser] } } });
            // Note: cascading delete typically handles permissions
            await prisma.$disconnect();
            process.exit(0);
        }
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

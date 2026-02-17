const path = require('path');
const { exec } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

console.log('Running Prisma Migrate...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');

const command = 'npx prisma migrate dev --name add_user_game_permissions';

const process_ = exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
        console.error(`Migration error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Migration stderr: ${stderr}`);
    }
    console.log(`Migration stdout: ${stdout}`);
});

process_.stdout.pipe(process.stdout);
process_.stderr.pipe(process.stderr);

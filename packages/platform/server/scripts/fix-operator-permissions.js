// Fix permissions for existing operators
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
const prisma = require('../db');

async function main() {
  console.log('🔧 Fixing operator permissions...\n');

  // Find all operators
  const operators = await prisma.user.findMany({
    where: { role: 'OPERATOR' },
    include: {
      allowedGames: true
    }
  });

  console.log(`Found ${operators.length} operators`);

  // Get all active games
  const activeGames = await prisma.gameType.findMany({
    where: { isActive: true }
  });

  console.log(`Found ${activeGames.length} active games\n`);

  for (const operator of operators) {
    console.log(`Checking operator: ${operator.username} (ID: ${operator.id})`);
    console.log(`  Current permissions: ${operator.allowedGames.length}`);

    if (operator.allowedGames.length === 0) {
      console.log(`  ⚠️  No permissions found. Granting access to all active games...`);

      try {
        // Grant access to all active games
        await prisma.userGamePermission.createMany({
          data: activeGames.map(game => ({
            userId: operator.id,
            gameTypeId: game.id,
            canCreate: true,
            canManage: true
          })),
          skipDuplicates: true
        });

        console.log(`  ✅ Granted access to ${activeGames.length} games\n`);
      } catch (error) {
        console.error(`  ❌ Error granting permissions:`, error.message);
      }
    } else {
      console.log(`  ✅ Already has permissions\n`);
    }
  }

  // Also fix any users with OPERATOR role but no entries in allowedGames
  const operatorsWithGames = await prisma.user.findMany({
    where: {
      role: 'OPERATOR',
      allowedGames: {
        none: {}
      }
    }
  });

  if (operatorsWithGames.length > 0) {
    console.log(`\nFound ${operatorsWithGames.length} operators without any game permissions`);
    
    for (const operator of operatorsWithGames) {
      console.log(`Fixing ${operator.username}...`);
      
      await prisma.userGamePermission.createMany({
        data: activeGames.map(game => ({
          userId: operator.id,
          gameTypeId: game.id,
          canCreate: true,
          canManage: true
        })),
        skipDuplicates: true
      });
    }
  }

  console.log('\n✅ Permission fix completed!');
  console.log('\nOperators can now:');
  console.log('  • See available games in the Operator Panel');
  console.log('  • Create sessions for games they have access to');
  console.log('  • Initiate games from the game session page');
}

main()
  .catch((e) => {
    console.error('❌ Fix failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

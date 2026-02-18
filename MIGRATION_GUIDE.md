# Database Migration Guide: Plugin Architecture

## Overview

This guide explains the migration from the old hardcoded game structure to the new plugin-based architecture.

## Key Changes

### 1. **GameType Table Enhanced**

**Old Schema:**
```prisma
model GameType {
  code        String   @unique
  name        String
  icon        String   // UI concern
  color       String   // UI concern
  maxPlayers  Int
  minPlayers  Int
}
```

**New Schema:**
```prisma
model GameType {
  code          String   @unique
  name          String
  pluginPath    String   // Path to plugin file
  configSchema  Json?    // JSON Schema for validation
  defaultConfig Json     // Default settings
  version       String   // Plugin version
  // ... more fields
}
```

**Why:** Games now self-register via plugins. The database tracks plugin metadata.

### 2. **GameHand → GameRound (Generic)**

**Old Schema:**
```prisma
model GameHand {
  winner    String   // Teen Patti specific
  potSize   Int      // Betting specific
  logs      Json
}
```

**New Schema:**
```prisma
model GameRound {
  roundNumber Int
  data        Json     // Game-specific round data
  transactions Transaction[]
}

model Transaction {
  type   TransactionType  // BUY_IN, WIN, LOSS, BET, etc.
  amount Int
  metadata Json          // Game-specific context
}
```

**Why:** Generic transaction ledger supports all game types without schema changes.

### 3. **Player → PlayerProfile (Extended)**

**Old Schema:**
```prisma
model Player {
  name           String
  sessionBalance Int
  seatPosition   Int?
}
```

**New Schema:**
```prisma
model PlayerProfile {
  name            String
  displayName     String?
  startingBalance Int
  currentBalance  Int
  status          PlayerStatus
  totalRoundsPlayed Int
  totalWinnings   Int
  totalLosses     Int
}
```

**Why:** Better tracking, supports guest players, richer statistics.

### 4. **GameState Table (NEW)**

```prisma
model GameState {
  sessionId String @unique
  data      Json   // Serialized plugin state
  version   Int    // For optimistic locking
}
```

**Why:** Plugins can save/restore state without platform knowing game-specifics.

### 5. **User Model Enhanced**

**Added:**
- `email` field
- `isActive` status
- `emailVerified` flag
- `passwordResetToken`
- Relation to `UserProfile`
- Proper enums for roles

### 6. **New UserProfile Table**

```prisma
model UserProfile {
  displayName String?
  phoneNumber String?
  avatarUrl   String?
  timezone    String
  language    String
  theme       String
  totalGamesPlayed    Int
  totalSessionsHosted Int
}
```

**Why:** Separate profile data from auth data.

## Migration Steps

### Step 1: Backup Database

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Create New Tables

Run these SQL commands:

```sql
-- Create enum types
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'PLAYER', 'GUEST');
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'BETA', 'COMING_SOON', 'DEPRECATED');
CREATE TYPE "SessionStatus" AS ENUM ('WAITING', 'READY', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ELIMINATED', 'LEFT');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "TransactionType" AS ENUM ('BUY_IN', 'WIN', 'LOSS', 'BET', 'PENALTY', 'BONUS', 'SETTLEMENT');

-- Add new columns to existing tables
ALTER TABLE "User" 
  ADD COLUMN "email" VARCHAR(255) UNIQUE,
  ADD COLUMN "role" "UserRole" DEFAULT 'PLAYER',
  ADD COLUMN "isActive" BOOLEAN DEFAULT true,
  ADD COLUMN "emailVerified" BOOLEAN DEFAULT false,
  ADD COLUMN "passwordResetToken" VARCHAR(255),
  ADD COLUMN "passwordResetExpires" TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing role strings to enum
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'ADMIN';
UPDATE "User" SET "role" = 'OPERATOR' WHERE "role" = 'OPERATOR';
UPDATE "User" SET "role" = 'PLAYER' WHERE "role" = 'PLAYER';
UPDATE "User" SET "role" = 'GUEST' WHERE "role" = 'GUEST';

-- Create UserProfile table
CREATE TABLE "UserProfile" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "displayName" VARCHAR(255),
  "phoneNumber" VARCHAR(50),
  "avatarUrl" VARCHAR(500),
  "timezone" VARCHAR(50) DEFAULT 'UTC',
  "language" VARCHAR(10) DEFAULT 'en',
  "theme" VARCHAR(20) DEFAULT 'dark',
  "totalGamesPlayed" INTEGER DEFAULT 0,
  "totalSessionsHosted" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update GameType table
ALTER TABLE "GameType" 
  ADD COLUMN "version" VARCHAR(20) DEFAULT '1.0.0',
  ADD COLUMN "pluginPath" VARCHAR(500),
  ADD COLUMN "configSchema" JSONB,
  ADD COLUMN "defaultConfig" JSONB DEFAULT '{}',
  ADD COLUMN "supportsRounds" BOOLEAN DEFAULT true,
  ADD COLUMN "status" "GameStatus" DEFAULT 'ACTIVE',
  ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create GameState table
CREATE TABLE "GameState" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID UNIQUE REFERENCES "GameSession"("id") ON DELETE CASCADE,
  "data" JSONB NOT NULL DEFAULT '{}',
  "version" INTEGER DEFAULT 1,
  "lastActionAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update GameSession table
ALTER TABLE "GameSession" 
  ALTER COLUMN "id" TYPE UUID USING "id"::UUID,
  ALTER COLUMN "gameTypeId" TYPE UUID USING "gameTypeId"::UUID,
  ADD COLUMN "config" JSONB DEFAULT '{}',
  ADD COLUMN "inviteCode" VARCHAR(50) UNIQUE,
  ADD COLUMN "endedAt" TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create enum type for status if not exists
ALTER TABLE "GameSession" 
  ADD COLUMN "status_new" "SessionStatus" DEFAULT 'WAITING';

-- Migrate status data
UPDATE "GameSession" SET "status_new" = 'WAITING' WHERE "status" = 'waiting';
UPDATE "GameSession" SET "status_new" = 'ACTIVE' WHERE "status" = 'active';
UPDATE "GameSession" SET "status_new" = 'COMPLETED' WHERE "status" = 'completed';
UPDATE "GameSession" SET "status_new" = 'PAUSED' WHERE "status" = 'paused';

-- Drop old status column and rename new one
ALTER TABLE "GameSession" DROP COLUMN "status";
ALTER TABLE "GameSession" RENAME COLUMN "status_new" TO "status";
```

### Step 3: Migrate GameHand to GameRound

```sql
-- Create new GameRound table
CREATE TABLE "GameRound" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID REFERENCES "GameSession"("id") ON DELETE CASCADE,
  "roundNumber" INTEGER NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}',
  "startedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP,
  "durationMs" INTEGER,
  UNIQUE("sessionId", "roundNumber")
);

-- Create Transaction table
CREATE TABLE "Transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "roundId" UUID REFERENCES "GameRound"("id") ON DELETE CASCADE,
  "playerId" UUID NOT NULL, -- References PlayerProfile
  "type" "TransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "description" VARCHAR(500),
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate GameHand data to GameRound format
INSERT INTO "GameRound" ("sessionId", "roundNumber", "data", "startedAt")
SELECT 
  "sessionId"::UUID,
  ROW_NUMBER() OVER (PARTITION BY "sessionId" ORDER BY "createdAt"),
  jsonb_build_object(
    'winner', "winner",
    'potSize', "potSize",
    'logs', "logs"
  ),
  "createdAt"
FROM "GameHand";

-- Create indexes
CREATE INDEX "idx_gameround_session" ON "GameRound"("sessionId");
CREATE INDEX "idx_transaction_round" ON "Transaction"("roundId");
CREATE INDEX "idx_transaction_player" ON "Transaction"("playerId");
```

### Step 4: Update Player to PlayerProfile

```sql
-- Create new PlayerProfile table
CREATE TABLE "PlayerProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID REFERENCES "GameSession"("id") ON DELETE CASCADE,
  "userId" INTEGER REFERENCES "User"("id"),
  "name" VARCHAR(255) NOT NULL,
  "displayName" VARCHAR(255),
  "seatPosition" INTEGER,
  "startingBalance" INTEGER DEFAULT 0,
  "currentBalance" INTEGER DEFAULT 0,
  "status" "PlayerStatus" DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP,
  "totalRoundsPlayed" INTEGER DEFAULT 0,
  "totalWinnings" INTEGER DEFAULT 0,
  "totalLosses" INTEGER DEFAULT 0,
  UNIQUE("sessionId", "name")
);

-- Migrate Player data
INSERT INTO "PlayerProfile" (
  "sessionId", "userId", "name", "seatPosition", 
  "startingBalance", "currentBalance", "joinedAt"
)
SELECT 
  "sessionId"::UUID,
  "userId",
  "name",
  "seatPosition",
  "sessionBalance",
  "sessionBalance",
  CURRENT_TIMESTAMP
FROM "Player";

-- Drop old Player table
DROP TABLE "Player";

-- Create indexes
CREATE INDEX "idx_playerprofile_session" ON "PlayerProfile"("sessionId");
CREATE INDEX "idx_playerprofile_user" ON "PlayerProfile"("userId");
```

### Step 5: Create GameEvent Table

```sql
CREATE TABLE "GameEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID REFERENCES "GameSession"("id") ON DELETE CASCADE,
  "roundId" UUID REFERENCES "GameRound"("id"),
  "playerId" UUID, -- References PlayerProfile
  "type" VARCHAR(50) NOT NULL,
  "action" VARCHAR(50),
  "payload" JSONB,
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_gameevent_session" ON "GameEvent"("sessionId");
CREATE INDEX "idx_gameevent_round" ON "GameEvent"("roundId");
CREATE INDEX "idx_gameevent_type" ON "GameEvent"("type");
CREATE INDEX "idx_gameevent_timestamp" ON "GameEvent"("timestamp");
```

### Step 6: Update Plugin Paths

```sql
-- Update existing games with plugin paths
UPDATE "GameType" SET "pluginPath" = 'teen-patti/server/GamePlugin.js' WHERE "code" = 'teen-patti';
UPDATE "GameType" SET "pluginPath" = 'rummy/server/GamePlugin.js' WHERE "code" = 'rummy';

-- Set default configs
UPDATE "GameType" SET "defaultConfig" = '{
  "bootAmount": 5,
  "maxBet": 1000,
  "allowSideShow": true
}' WHERE "code" = 'teen-patti';

UPDATE "GameType" SET "defaultConfig" = '{
  "jokersEnabled": true,
  "pointsValue": 1,
  "maxDrop": 30
}' WHERE "code" = 'rummy';
```

### Step 7: Apply Prisma Migration

```bash
# Generate Prisma client
cd packages/platform/server
npx prisma generate

# Create migration
npx prisma migrate dev --name plugin_architecture

# Or if using db push (development only)
npx prisma db push
```

## Data Integrity Checks

After migration, verify:

```sql
-- Check user count
SELECT COUNT(*) as total_users FROM "User";

-- Check game sessions
SELECT COUNT(*) as total_sessions FROM "GameSession";

-- Check migrated rounds
SELECT COUNT(*) as total_rounds FROM "GameRound";

-- Check player profiles
SELECT COUNT(*) as total_players FROM "PlayerProfile";

-- Verify game types have plugin paths
SELECT "code", "pluginPath" FROM "GameType" WHERE "pluginPath" IS NULL;
```

## Rollback Plan

If issues occur:

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Post-Migration

1. **Update Game Managers** to implement the GamePlugin interface
2. **Test both games** thoroughly
3. **Update API endpoints** to use the plugin registry
4. **Update client code** to handle new response formats
5. **Deploy and monitor** for errors

## Benefits of New Architecture

✅ **Add new games without database changes**  
✅ **Uniform treatment of all games by platform**  
✅ **Better audit trail with GameEvent table**  
✅ **Flexible transaction ledger supports any game type**  
✅ **State persistence allows game resumption**  
✅ **Plugin versioning and hot-reloading support**  
✅ **Richer user profiles and player statistics**

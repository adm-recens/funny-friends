# Branch Structure Documentation

## CRITICAL: This is a GAME LEDGER APPLICATION

**⚠️ IMPORTANT CONTEXT FOR DEVELOPERS ⚠️**

This is **NOT** an online gaming platform where people play games over the internet. This is a **DIGITAL LEDGER SYSTEM** for recording physical card games that people play in person.

### What This Means

- **Physical Games**: Players gather in person and use REAL cards on a REAL table
- **Digital Recording**: One person (the operator) uses this app to record scores
- **Score Tracking**: The app tracks who wins each hand, running totals, and final settlements
- **No Online Gameplay**: There is no "playing" in the app - only recording what happened physically

### Why This Architecture?

- **GameManager Classes**: Validate hand rankings and calculate scores (not run game logic)
- **Real-time Updates**: So all players can see scores on their phones as the operator records them
- **Session Management**: Track a physical gathering from start to finish
- **Ledger Features**: Financial tracking, history, settlements

### For Future Development

When adding features, remember:
- **The game happens offline** - don't add "play" buttons or game controls
- **Focus on recording** - how does the operator quickly input what happened?
- **Validation, not execution** - validate that recorded hands are valid, don't "deal" cards
- **Multi-viewer support** - multiple people should see the ledger simultaneously

---

## Overview

This repository uses a **Monorepo with Workspaces** structure to manage the platform and games separately. We use npm workspaces and Turborepo for build orchestration.

## Monorepo Structure

```
funny-friends/
├── package.json          # Root workspace configuration
├── turbo.json            # Turborepo build pipeline
├── packages/
│   ├── shared/           # Shared utilities, types, config
│   ├── platform/         # Core platform (auth, admin, API)
│   ├── teen-patti/       # Teen Patti game
│   └── rummy/            # Rummy game
└── BRANCH_STRUCTURE.md   # This file
```

## Branch Hierarchy

```
main (production - platform + all games)
├── platform (platform code only)
└── games-base (platform + all games - development integration)
    ├── games/teen-patti (platform + teen-patti only)
    └── games/rummy (platform + rummy only)
```

## Branch Descriptions

### `main`
- **Purpose**: Production-ready code with all features
- **Contents**: Complete platform + all games integrated
- **Usage**: Deploy to production, stable releases

### `platform`
- **Purpose**: Core platform development
- **Contents**: 
  - `packages/platform/` - Authentication, user management, admin dashboards
  - No game-specific code
- **Usage**: 
  - Develop platform features independently
  - Test platform without games
  - Stable base for game development

### `games-base`
- **Purpose**: Integration branch for all games
- **Contents**: Platform + all games combined
- **Usage**:
  - Integrate new games
  - Test game-platform interactions
  - Pre-production testing

### `games/teen-patti`
- **Purpose**: Teen Patti game development
- **Contents**: Platform + Teen Patti game only
- **Usage**:
  - Develop Teen Patti features
  - Game-specific bug fixes
  - Independent game testing

### `games/rummy`
- **Purpose**: Rummy game development  
- **Contents**: Platform + Rummy game only
- **Usage**:
  - Develop Rummy features
  - Game-specific bug fixes
  - Independent game testing

---

## Plugin Architecture (NEW)

The platform now uses a **Plugin-Based Architecture** for games. This enables:

✅ **Add games without modifying platform code**  
✅ **Auto-discovery of game plugins**  
✅ **Uniform treatment of all games**  
✅ **Hot-reloading for development**  
✅ **Plugin versioning and isolation**

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      PLATFORM CORE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Auth       │  │    API       │  │  Plugin Registry │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Plugin Interface Layer                    │ │
│  │   createSession() | handleAction() | getPublicState() │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ Plugin Registry
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Teen    │       │ Rummy   │       │ Poker   │
   │ Patti   │       │ Plugin  │       │ Plugin  │
   │ Plugin  │       │         │       │         │
   └─────────┘       └─────────┘       └─────────┘
```

### Plugin Interface

All games must implement the `GamePlugin` interface:

```javascript
class GamePlugin {
  // Required Methods
  metadata()           // Return game info (id, name, version, etc.)
  createSession()      // Initialize new game session
  handleAction()       // Process player actions
  getPublicState()     // Get state visible to all
  getPlayerState()     // Get state for specific player
  serialize()          // Save state for persistence
  deserialize()        // Restore state from persistence
  
  // Optional Methods
  addPlayer()          // Add player to session
  removePlayer()       // Remove player from session
  startGame()          // Begin the game
  endGame()            // End the game
  validateConfig()     // Validate configuration
}
```

### Adding a New Game (Plugin Method)

**Step 1: Create Game Package**
```bash
mkdir -p packages/poker/server
touch packages/poker/server/GamePlugin.js
```

**Step 2: Implement Plugin Interface**
```javascript
// packages/poker/server/GamePlugin.js
const EventEmitter = require('events');

class PokerPlugin extends EventEmitter {
  metadata() {
    return {
      id: 'poker',
      name: 'Texas Hold\'em Poker',
      version: '1.0.0',
      minPlayers: 2,
      maxPlayers: 10,
      defaultConfig: { smallBlind: 10, bigBlind: 20 }
    };
  }
  
  createSession(sessionId, name, config) {
    // Initialize game state
    this.sessions.set(sessionId, { /* ... */ });
  }
  
  handleAction(sessionId, playerId, action) {
    // Process game action
    // Return result
  }
  
  // ... implement other required methods
}

module.exports = PokerPlugin;
```

**Step 3: That's It!**

The platform automatically:
- Discovers the plugin on startup
- Registers it in the Plugin Registry
- Syncs metadata to the database
- Makes it available for session creation

**No platform code changes required!**

### Plugin Auto-Discovery

On server startup, the platform scans `packages/` directory:

```javascript
// packages/platform/server/plugins/index.js
const packages = fs.readdirSync('packages/')
  .filter(dir => dir !== 'platform' && dir !== 'shared');

packages.forEach(pkg => {
  const pluginPath = `packages/${pkg}/server/GamePlugin.js`;
  if (fs.existsSync(pluginPath)) {
    const Plugin = require(pluginPath);
    registry.register(new Plugin());
  }
});
```

### Database Schema for Plugins

The database schema is now **completely generic**:

- **GameType** - Plugin metadata (id, name, version, config schema)
- **GameSession** - Generic container with `config` JSON field
- **GameState** - Serialized plugin state
- **GameRound** - Generic round data
- **Transaction** - Generic ledger entries (WIN, LOSS, BET, etc.)
- **GameEvent** - Complete audit trail

No game-specific fields!

### Benefits

| Before (Hardcoded) | After (Plugin) |
|-------------------|----------------|
| Modify 5+ files to add game | Drop in one file |
| Platform knows game internals | Platform only knows interface |
| Database schema changes needed | No schema changes |
| Single game version | Per-game versioning |
| Restart server to update | Hot-reload in development |

### Migration Notes

See `MIGRATION_GUIDE.md` for:
- Schema changes from old to new architecture
- Data migration SQL scripts
- Updating existing games to Plugin interface
- Rollback procedures

---

## Control Panels

The platform provides dedicated control panels for Administrators and Operators.

### Admin Control Panel (`/admin`)

**Full platform management interface for administrators.**

**Routes:**
- `/admin/dashboard` - Overview with system stats and quick actions
- `/admin/users` - User management (CRUD operations)
- `/admin/permissions` - Game permissions matrix
- `/admin/games` - Game session management
- `/admin/settings` - Platform configuration
- `/admin/monitoring` - System health and logs

**Features:**
- User creation, editing, and deletion
- Role assignment (ADMIN, OPERATOR, PLAYER, GUEST)
- Game permission management per user
- Enable/disable games
- Platform-wide settings (security, notifications, data)
- Danger zone for destructive actions
- Real-time search and filtering
- Responsive sidebar navigation

**Access:** ADMIN role only

### Operator Control Panel (`/operator`)

**Session management interface for operators.**

**Routes:**
- `/operator/dashboard` - Overview with session stats
- `/operator/sessions` - Session management
- `/operator/games` - Available games list
- `/operator/profile` - Account settings

**Features:**
- Create and manage game sessions
- View active and ended sessions
- Quick start guide for new operators
- Profile management
- Password change functionality
- Mobile-friendly design

**Access:** OPERATOR and ADMIN roles

### Navigation Structure

```
Admin Panel (/admin)
├── Dashboard          → Overview & Analytics
├── User Management    → Create/Edit/Delete Users
├── Permissions        → Game Access Control
├── Games & Sessions   → Session Monitoring
├── Platform Settings  → Configuration
└── Monitoring         → System Health

Operator Panel (/operator)
├── Dashboard          → Session Overview
├── My Sessions        → Session Management
├── Available Games    → Games List
└── My Profile         → Account Settings
```

## Workflow

### Adding a New Game

1. Create new game package in `packages/<game-name>/`
2. Create branch from `games-base`:
   ```bash
   git checkout games-base
   git checkout -b games/<game-name>
   ```
3. Remove other games from the branch:
   ```bash
   git rm -rf packages/<other-games>
   git commit -m "<Game> branch: platform + <game> only"
   ```
4. Develop game in isolation
5. Merge back to `games-base` for integration testing
6. Merge to `main` for production

### Platform Development

1. Work on `platform` branch for core platform features
2. Merge platform changes to `games-base` first
3. Test integration with games
4. Propagate to individual game branches:
   ```bash
   git checkout games/teen-patti
   git merge games-base
   ```

### Typical Development Flow

```
Platform Feature:
platform → games-base → games/* → main

Game Feature:
games/<game> → games-base → main

Bug Fix (platform):
platform → games-base → games/* → main

Bug Fix (game):
games/<game> → games-base → main (if shared)
```

## Package Structure

### Workspace Packages

```
packages/
├── shared/               # Shared utilities and configurations
│   ├── src/
│   │   ├── config.js     # API_URL, SOCKET_CONFIG
│   │   ├── types/        # Type definitions
│   │   └── utils/        # Helper functions
│   └── package.json      # @funny-friends/shared
│
├── platform/             # Core platform
│   ├── client/           # React app (@funny-friends/platform-client)
│   │   ├── src/
│   │   │   ├── pages/    # Welcome, Login, Admin, etc.
│   │   │   ├── context/  # AuthContext, ToastContext
│   │   │   └── components/
│   │   └── package.json
│   └── server/           # API server (@funny-friends/platform-server)
│       ├── controllers/
│       ├── prisma/       # Database schema
│       ├── server.js
│       └── package.json
│
├── teen-patti/           # Teen Patti game
│   ├── client/           # Game UI (@funny-friends/teen-patti-client)
│   │   └── pages/
│   └── server/           # Game logic (@funny-friends/teen-patti-server)
│       └── GameManager.js
│
└── rummy/                # Rummy game
    ├── client/           # Game UI (@funny-friends/rummy-client)
    │   └── pages/
    └── server/           # Game logic (@funny-friends/rummy-server)
        └── GameManager.js
```

## Best Practices

1. **Always branch from `games-base`** for new game branches
2. **Test on `games-base`** before merging to `main`
3. **Keep platform changes minimal** on game branches
4. **Sync regularly** - merge `games-base` into game branches frequently
5. **Use feature branches** within each game branch for specific features

## Monorepo Commands

### Installing Dependencies

```bash
# Install all dependencies for all packages
npm install

# Install dependency in specific package
npm install <package> --workspace=@funny-friends/platform-client
```

### Development

```bash
# Start all packages in development mode
npm run dev

# Start only platform
npm run dev:platform

# Start specific game
npm run dev:teen-patti
npm run dev:rummy
```

### Building

```bash
# Build all packages
npm run build

# Build only platform
npm run build:platform

# Build all games
npm run build:games
```

### Database

```bash
# Push schema changes
npm run db:push

# Open Prisma Studio
npm run db:studio

# Generate Prisma client
npm run db:generate
```

## Git Branch Commands

```bash
# Switch to platform branch
git checkout platform

# Switch to specific game
git checkout games/teen-patti
git checkout games/rummy

# Update game branch with latest platform changes
git checkout games/teen-patti
git merge games-base

# Add new game branch
git checkout games-base
git checkout -b games/<new-game>
git rm -rf packages/<other-games>
git commit -m "<New Game> branch: initial setup"
```

## Important Notes

### Branch Content

- **Game branches (`games/*`)**: Contain only their specific game + platform + shared
- **games-base**: Integration point with ALL games - always test here before production
- **platform**: Contains ONLY platform and shared packages (no games)
- **main**: Production branch with complete integration

### Code Flow

```
Platform changes: platform → games-base → games/* → main
Game changes:     games/<game> → games-base → main
```

### Monorepo Best Practices

1. **Use workspace dependencies**: Reference other packages using their workspace name:
   ```json
   "dependencies": {
     "@funny-friends/shared": "^1.0.0"
   }
   ```

2. **Keep packages independent**: Each package should be able to build independently

3. **Shared code goes in `packages/shared/`**: Don't duplicate utilities across packages

4. **Import from shared**:
   ```javascript
   import { API_URL, SOCKET_CONFIG } from '@funny-friends/shared';
   ```

5. **Platform server has temporary GameManager**: The platform server currently includes GameManager for backward compatibility. Future refactoring will move this to a proper plugin system.

### What NOT to do

- Never commit game-specific code to `platform` branch
- Never push platform-only changes directly to `games/*` branches
- Don't modify `package-lock.json` files manually
- Don't commit `node_modules` or build artifacts

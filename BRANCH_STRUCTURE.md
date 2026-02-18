# Branch Structure Documentation

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

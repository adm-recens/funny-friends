# Branch Structure Documentation

## Overview

This repository uses a hierarchical branch structure to manage the platform and games separately.

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

```
packages/
├── platform/
│   ├── client/     # React app (auth, admin, dashboard)
│   └── server/     # API, database, auth
├── teen-patti/
│   ├── client/     # Game UI components
│   └── server/     # Game logic, state management
└── rummy/
    ├── client/     # Game UI components
    └── server/     # Game logic, state management
```

## Best Practices

1. **Always branch from `games-base`** for new game branches
2. **Test on `games-base`** before merging to `main`
3. **Keep platform changes minimal** on game branches
4. **Sync regularly** - merge `games-base` into game branches frequently
5. **Use feature branches** within each game branch for specific features

## Commands Quick Reference

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

- Game branches (`games/*`) contain only their specific game + platform
- `games-base` is the integration point - always test here before production
- Platform changes should flow down: `platform` → `games-base` → `games/*`
- Game changes should flow up: `games/<game>` → `games-base` → `main`
- Never commit game-specific code to `platform` branch
- Never push platform-only changes directly to `games/*` branches

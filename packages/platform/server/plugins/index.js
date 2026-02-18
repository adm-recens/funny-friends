/**
 * Plugin Registry System
 * 
 * Manages game plugins with auto-discovery and registration.
 * Provides uniform interface for the platform to interact with all games.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.loaded = false;
  }

  /**
   * Register a game plugin
   * @param {Object} plugin - Game plugin instance
   */
  register(plugin) {
    if (!plugin || typeof plugin.metadata !== 'function') {
      console.error('Invalid plugin: must have metadata() method');
      return false;
    }

    const metadata = plugin.metadata();
    
    if (!metadata.id || !metadata.name) {
      console.error('Invalid plugin metadata: must have id and name');
      return false;
    }

    // Validate plugin has required methods
    const requiredMethods = [
      'createSession',
      'handleAction',
      'getPublicState',
      'serialize',
      'deserialize'
    ];

    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        console.error(`Plugin ${metadata.id} missing required method: ${method}`);
        return false;
      }
    }

    this.plugins.set(metadata.id, plugin);
    console.log(`✓ Registered plugin: ${metadata.name} v${metadata.version || '1.0.0'}`);
    return true;
  }

  /**
   * Get a plugin by ID
   * @param {string} id - Plugin ID
   * @returns {Object|null} Plugin instance or null
   */
  get(id) {
    return this.plugins.get(id) || null;
  }

  /**
   * Get all registered plugins
   * @returns {Array} Array of plugin instances
   */
  getAll() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all plugin metadata
   * @returns {Array} Array of metadata objects
   */
  getAllMetadata() {
    return this.getAll().map(plugin => plugin.metadata());
  }

  /**
   * Check if plugin exists
   * @param {string} id - Plugin ID
   * @returns {boolean}
   */
  has(id) {
    return this.plugins.has(id);
  }

  /**
   * Auto-discover and load all game plugins
   * Scans packages directory for game plugins
   */
  async loadPlugins() {
    if (this.loaded) {
      console.log('Plugins already loaded');
      return;
    }

    console.log('\n🔍 Scanning for game plugins...\n');

    const packagesDir = path.join(__dirname, '../../../../packages');
    
    if (!fs.existsSync(packagesDir)) {
      console.warn('Packages directory not found');
      return;
    }

    const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => name !== 'platform' && name !== 'shared');

    for (const pkg of packages) {
      await this.loadPluginFromPackage(pkg, packagesDir);
    }

    // Also sync with database
    await this.syncWithDatabase();

    this.loaded = true;
    
    console.log(`\n✅ Loaded ${this.plugins.size} game plugin(s)\n`);
  }

  /**
   * Load a plugin from a specific package
   */
  async loadPluginFromPackage(pkgName, packagesDir) {
    // Try multiple possible paths for the plugin file
    const possiblePaths = [
      path.join(packagesDir, pkgName, 'server', 'GamePlugin.js'),
      path.join(packagesDir, pkgName, 'server', 'index.js'),
      path.join(packagesDir, pkgName, 'server', 'GameManager.js'),
    ];

    for (const pluginPath of possiblePaths) {
      if (fs.existsSync(pluginPath)) {
        try {
          // Clear require cache for hot reloading
          delete require.cache[require.resolve(pluginPath)];
          
          const PluginClass = require(pluginPath);
          const plugin = new PluginClass();
          
          if (this.register(plugin)) {
            return true;
          }
        } catch (error) {
          console.warn(`⚠️  Failed to load plugin from ${pkgName}: ${error.message}`);
        }
        break; // Stop trying other paths if we found a file but it failed
      }
    }
    
    return false;
  }

  /**
   * Sync registered plugins with database
   * Creates/updates GameType records
   */
  async syncWithDatabase() {
    console.log('\n🔄 Syncing plugins with database...\n');

    for (const plugin of this.getAll()) {
      const metadata = plugin.metadata();
      
      try {
        await prisma.gameType.upsert({
          where: { code: metadata.id },
          update: {
            name: metadata.name,
            description: metadata.description,
            version: metadata.version || '1.0.0',
            pluginPath: metadata.pluginPath || '',
            configSchema: metadata.configSchema || {},
            defaultConfig: metadata.defaultConfig || {},
            minPlayers: metadata.minPlayers || 2,
            maxPlayers: metadata.maxPlayers || 6,
            supportsRounds: metadata.supportsRounds !== false,
            isActive: true,
          },
          create: {
            code: metadata.id,
            name: metadata.name,
            description: metadata.description,
            version: metadata.version || '1.0.0',
            pluginPath: metadata.pluginPath || '',
            configSchema: metadata.configSchema || {},
            defaultConfig: metadata.defaultConfig || {},
            minPlayers: metadata.minPlayers || 2,
            maxPlayers: metadata.maxPlayers || 6,
            supportsRounds: metadata.supportsRounds !== false,
            status: 'ACTIVE',
            isActive: true,
          },
        });
        
        console.log(`  ✓ Synced: ${metadata.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to sync ${metadata.id}: ${error.message}`);
      }
    }
  }

  /**
   * Reload all plugins (for development)
   */
  async reload() {
    console.log('\n🔄 Reloading plugins...\n');
    this.plugins.clear();
    this.loaded = false;
    await this.loadPlugins();
  }

  /**
   * Create a new game session
   * @param {string} gameTypeId - Game type code
   * @param {Object} config - Session configuration
   * @returns {Object} Session result
   */
  async createSession(gameTypeId, sessionData) {
    const plugin = this.get(gameTypeId);
    
    if (!plugin) {
      throw new Error(`Game type not found: ${gameTypeId}`);
    }

    // Validate config
    const metadata = plugin.metadata();
    const playerCount = sessionData.players?.length || 0;
    
    if (playerCount < metadata.minPlayers) {
      throw new Error(`Minimum ${metadata.minPlayers} players required`);
    }
    
    if (playerCount > metadata.maxPlayers) {
      throw new Error(`Maximum ${metadata.maxPlayers} players allowed`);
    }

    // Create session in database
    const session = await prisma.gameSession.create({
      data: {
        name: sessionData.name,
        gameTypeId: gameTypeId,
        createdBy: sessionData.createdBy,
        config: sessionData.config || metadata.defaultConfig || {},
        totalRounds: sessionData.totalRounds || 10,
        isPublic: sessionData.isPublic || false,
        inviteCode: sessionData.inviteCode,
        status: 'WAITING',
      },
    });

    // Initialize plugin session
    plugin.createSession(session.id, session.name, session.config);

    // Add players
    if (sessionData.players) {
      for (const player of sessionData.players) {
        await prisma.playerProfile.create({
          data: {
            sessionId: session.id,
            userId: player.userId,
            name: player.name,
            displayName: player.displayName,
            seatPosition: player.seatPosition,
            startingBalance: player.startingBalance || 0,
            currentBalance: player.startingBalance || 0,
          },
        });

        plugin.addPlayer(session.id, {
          id: player.userId?.toString() || player.name,
          name: player.name,
          seat: player.seatPosition,
          balance: player.startingBalance || 0,
        });
      }
    }

    // Save initial state
    await prisma.gameState.create({
      data: {
        sessionId: session.id,
        data: plugin.serialize(session.id),
      },
    });

    return session;
  }

  /**
   * Handle a game action
   * @param {string} sessionId - Session ID
   * @param {string} playerId - Player ID
   * @param {Object} action - Action data
   * @returns {Object} Action result
   */
  async handleAction(sessionId, playerId, action) {
    // Get session
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const plugin = this.get(session.gameTypeId);
    
    if (!plugin) {
      throw new Error('Game plugin not found');
    }

    // Execute action
    const result = plugin.handleAction(sessionId, playerId, action);

    if (result.success) {
      // Persist state
      await prisma.gameState.update({
        where: { sessionId },
        data: {
          data: plugin.serialize(sessionId),
          version: { increment: 1 },
          lastActionAt: new Date(),
        },
      });

      // Log event
      await prisma.gameEvent.create({
        data: {
          sessionId,
          playerId,
          type: 'ACTION',
          action: action.type,
          payload: action.payload || action,
        },
      });

      // Update session status if needed
      if (result.phase && result.phase !== session.status) {
        await prisma.gameSession.update({
          where: { id: sessionId },
          data: { 
            status: result.phase,
            currentRound: result.currentRound || session.currentRound,
          },
        });
      }
    }

    return result;
  }

  /**
   * Get public game state for broadcasting
   * @param {string} sessionId - Session ID
   * @returns {Object} Public state
   */
  async getPublicState(sessionId) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        gameType: true,
        players: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const plugin = this.get(session.gameTypeId);
    
    if (!plugin) {
      throw new Error('Game plugin not found');
    }

    const gameState = plugin.getPublicState(sessionId);
    
    return {
      ...gameState,
      sessionId: session.id,
      sessionName: session.name,
      gameType: session.gameType.name,
      players: session.players,
    };
  }

  /**
   * Get private game state for specific player
   * @param {string} sessionId - Session ID
   * @param {string} playerId - Player ID
   * @returns {Object} Player state
   */
  async getPlayerState(sessionId, playerId) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const plugin = this.get(session.gameTypeId);
    
    if (!plugin) {
      throw new Error('Game plugin not found');
    }

    return plugin.getPlayerState(sessionId, playerId);
  }

  /**
   * End a game session
   * @param {string} sessionId - Session ID
   */
  async endSession(sessionId) {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const plugin = this.get(session.gameTypeId);
    
    if (plugin && plugin.endGame) {
      plugin.endGame(sessionId);
    }

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });
  }
}

// Singleton instance
const registry = new PluginRegistry();

module.exports = {
  PluginRegistry,
  registry,
  
  // Convenience methods
  getPlugin: (id) => registry.get(id),
  getAllPlugins: () => registry.getAllMetadata(),
  loadPlugins: () => registry.loadPlugins(),
  reloadPlugins: () => registry.reload(),
  createSession: (gameTypeId, config) => registry.createSession(gameTypeId, config),
  handleAction: (sessionId, playerId, action) => registry.handleAction(sessionId, playerId, action),
  getPublicState: (sessionId) => registry.getPublicState(sessionId),
  getPlayerState: (sessionId, playerId) => registry.getPlayerState(sessionId, playerId),
};

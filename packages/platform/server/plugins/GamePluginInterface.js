/**
 * GAME PLUGIN INTERFACE
 * 
 * All games must implement this interface to be registered with the platform.
 * This allows the platform to treat all games uniformly without knowing game-specific rules.
 */

/**
 * @interface GamePlugin
 * 
 * REQUIRED METHODS:
 * 
 * 1. metadata() -> PluginMetadata
 *    - Returns game information (id, name, version, etc.)
 * 
 * 2. createSession(sessionId, sessionName, config) -> void
 *    - Initialize a new game session
 *    - config contains game-specific settings
 * 
 * 3. handleAction(sessionId, playerId, action) -> ActionResult
 *    - Process a game action
 *    - Returns success/failure with updated state
 * 
 * 4. getPublicState(sessionId) -> GameState
 *    - Returns state visible to all players
 *    - Must not expose private info (other players' hands)
 * 
 * 5. getPlayerState(sessionId, playerId) -> PlayerState
 *    - Returns state visible to specific player
 *    - Include private info (player's own hand)
 * 
 * 6. addPlayer(sessionId, playerData) -> Result
 *    - Add a player to the session
 *    - playerData: { id, name, seat, balance, ... }
 * 
 * 7. removePlayer(sessionId, playerId) -> Result
 *    - Remove a player from the session
 * 
 * 8. startGame(sessionId) -> Result
 *    - Begin the game
 *    - Deal cards, initialize state, etc.
 * 
 * 9. endGame(sessionId) -> FinalState
 *    - End the game and return final results
 * 
 * 10. serialize(sessionId) -> JSON
 *     - Return complete game state for persistence
 * 
 * 11. deserialize(sessionId, data) -> void
 *     - Restore game state from persisted data
 * 
 * 12. validateConfig(config) -> ValidationResult
 *     - Validate game configuration
 *     - Check min/max players, settings, etc.
 * 
 * 13. getDefaultConfig() -> GameConfig
 *     - Return default configuration for new sessions
 * 
 * EVENTS (EventEmitter):
 * - 'state_change' -> Emitted when game state changes
 * - 'player_action' -> Emitted when player performs action
 * - 'round_complete' -> Emitted when a round/hand ends
 * - 'game_complete' -> Emitted when entire game ends
 * - 'error' -> Emitted when game error occurs
 * 
 * CONFIGURATION SCHEMA:
 * Each plugin defines its own config schema:
 * {
 *   minPlayers: number,
 *   maxPlayers: number,
 *   defaultRounds?: number,
 *   settings: {
 *     // Game-specific settings
 *   }
 * }
 * 
 * ACTION SCHEMA:
 * Actions are generic and game-specific:
 * {
 *   type: string,  // 'BET', 'FOLD', 'DRAW', 'DECLARE', etc.
 *   payload: any   // Game-specific action data
 * }
 * 
 * STATE SCHEMA:
 * {
 *   phase: string,           // 'SETUP', 'ACTIVE', 'COMPLETE'
 *   players: PlayerState[],
 *   currentRound: number,
 *   totalRounds: number,
 *   metadata: any,          // Game-specific state
 *   history: GameEvent[]    // Audit trail
 * }
 */

// Example plugin implementation structure:
/*
class BaseGamePlugin extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
  }

  metadata() {
    return {
      id: 'teen-patti',
      name: 'Teen Patti',
      version: '1.0.0',
      description: 'Indian Poker - 3 card game',
      minPlayers: 2,
      maxPlayers: 17,
      defaultRounds: 10,
      supportedActions: ['PACK', 'CHAAL', 'BLIND', 'SEEN', 'SIDE_SHOW', 'SHOW'],
      requiresDeck: true,
      deckSize: 52
    };
  }

  createSession(sessionId, sessionName, config) {
    this.sessions.set(sessionId, {
      id: sessionId,
      name: sessionName,
      config,
      state: this.createInitialState(config)
    });
  }

  handleAction(sessionId, playerId, action) {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, error: 'Session not found' };
    
    // Game-specific action handling
    const result = this.processAction(session, playerId, action);
    
    if (result.success) {
      this.emit('state_change', {
        sessionId,
        state: this.getPublicState(sessionId)
      });
    }
    
    return result;
  }

  // ... other required methods
}

module.exports = BaseGamePlugin;
*/

// Plugin registration example:
/*
// In packages/platform/server/plugins/index.js
const plugins = new Map();

function registerPlugin(plugin) {
  const metadata = plugin.metadata();
  plugins.set(metadata.id, plugin);
  console.log(`Registered game plugin: ${metadata.name} v${metadata.version}`);
}

function getPlugin(gameTypeId) {
  return plugins.get(gameTypeId);
}

// Auto-discovery - load all game plugins
const gamePackages = fs.readdirSync(path.join(__dirname, '../../../..'))
  .filter(dir => dir.startsWith('packages/') && dir !== 'packages/platform' && dir !== 'packages/shared');

gamePackages.forEach(pkg => {
  try {
    const pluginPath = path.join(__dirname, '../../../..', pkg, 'server/GamePlugin.js');
    if (fs.existsSync(pluginPath)) {
      const PluginClass = require(pluginPath);
      registerPlugin(new PluginClass());
    }
  } catch (e) {
    console.warn(`Failed to load plugin from ${pkg}:`, e.message);
  }
});

module.exports = { registerPlugin, getPlugin, getAllPlugins: () => Array.from(plugins.values()) };
*/

// Usage in server.js:
/*
const { getPlugin } = require('./plugins');

// When creating session:
const plugin = getPlugin(gameType.code);
if (!plugin) throw new Error(`Unknown game type: ${gameType.code}`);

const result = plugin.createSession(sessionId, sessionName, config);

// When handling actions:
socket.on('game_action', ({ sessionId, action, payload }) => {
  const plugin = getPlugin(session.gameTypeId);
  const result = plugin.handleAction(sessionId, socket.user.id, { type: action, ...payload });
  
  if (result.success) {
    // Persist state
    await prisma.gameState.upsert({
      where: { sessionId },
      update: { data: plugin.serialize(sessionId) },
      create: { sessionId, data: plugin.serialize(sessionId) }
    });
    
    // Broadcast to all clients
    io.to(sessionId).emit('game_update', plugin.getPublicState(sessionId));
  }
});
*/

// This interface allows:
// 1. Adding new games without modifying platform code
// 2. Uniform treatment of all games by the platform
// 3. Game-specific logic encapsulated in plugins
// 4. Easy testing and versioning of games independently
// 5. Hot-swapping game implementations

console.log('Game Plugin Interface defined. Import this file for documentation purposes.');

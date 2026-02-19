/**
 * Stub GameManager for platform deployment
 * This is a minimal implementation that allows the platform to function
 * without the full game logic. Games can be implemented later as plugins.
 */

const EventEmitter = require('events');

class GameManager extends EventEmitter {
  constructor(config) {
    super();
    
    // Support both old format (sessionId, sessionName, totalRounds) and new config object
    if (typeof config === 'object' && config !== null) {
      this.sessionId = config.sessionId;
      this.sessionName = config.sessionName;
      this.gameLimitType = config.gameLimitType || 'rounds';
      this.totalRounds = config.totalRounds;
      this.targetScore = config.targetScore;
    } else {
      // Legacy format: (sessionId, sessionName, totalRounds)
      this.sessionId = arguments[0];
      this.sessionName = arguments[1];
      this.totalRounds = arguments[2];
      this.gameLimitType = 'rounds';
    }
    
    this.currentRound = 1;
    this.gameState = {
      players: [],
      gamePlayers: [],
      phase: 'SETUP',
      pot: 0,
      currentBet: 0,
      dealerPosition: 0,
      currentPlayerIndex: 0,
      gameLimitType: this.gameLimitType,
      totalRounds: this.totalRounds,
      targetScore: this.targetScore
    };
    this.players = new Map();
    this.viewers = new Map();
    this.isActive = true;
    this.gameHistory = [];
    
    console.log(`[GameManager] Created for session: ${this.sessionName} (${this.gameLimitType})`);
  }

  setPlayers(players) {
    this.gameState.players = players.map(p => ({
      id: p.id,
      name: p.name,
      seat: p.seat,
      sessionBalance: p.sessionBalance || 0,
      status: 'ACTIVE',
      folded: false,
      invested: 0,
      hand: null
    }));
    console.log(`[GameManager] Set ${players.length} players`);
  }

  addPlayer(socket, playerData) {
    const player = {
      id: playerData.id,
      name: playerData.name,
      socket: socket,
      seat: playerData.seat || this.gameState.players.length + 1,
      sessionBalance: playerData.sessionBalance || 0,
      status: 'ACTIVE',
      folded: false,
      invested: 0,
      hand: null
    };
    
    this.players.set(socket.id, player);
    this.gameState.players.push(player);
    
    console.log(`[GameManager] Player added: ${player.name}`);
    return player;
  }

  addViewer(socket) {
    this.viewers.set(socket.id, { socket });
    console.log(`[GameManager] Viewer added`);
  }

  removeParticipant(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      this.gameState.players = this.gameState.players.filter(p => p.id !== player.id);
      this.players.delete(socketId);
      console.log(`[GameManager] Player removed: ${player.name}`);
      return { type: 'player', name: player.name };
    }
    
    if (this.viewers.has(socketId)) {
      this.viewers.delete(socketId);
      console.log(`[GameManager] Viewer removed`);
      return { type: 'viewer' };
    }
    
    return null;
  }

  getPlayerCount() {
    return this.players.size;
  }

  getViewerCount() {
    return this.viewers.size;
  }

  getPublicState() {
    const state = {
      sessionName: this.sessionName,
      currentRound: this.currentRound,
      phase: this.gameState.phase,
      gameLimitType: this.gameLimitType,
      players: this.gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        seat: p.seat,
        sessionBalance: p.sessionBalance,
        status: p.status,
        folded: p.folded,
        invested: p.invested
      })),
      pot: this.gameState.pot,
      currentBet: this.gameState.currentBet,
      isActive: this.isActive
    };
    
    // Include game-specific configuration
    if (this.gameLimitType === 'points') {
      state.targetScore = this.targetScore;
    } else {
      state.totalRounds = this.totalRounds;
    }
    
    return state;
  }

  startRound() {
    console.log(`[GameManager] Round ${this.currentRound} started`);
    this.gameState.phase = 'ACTIVE';
    const state = this.getPublicState();
    // Emit state change to all listeners
    this.emit('state_change', state);
    return { success: true, ...state };
  }

  processAction(socketId, action) {
    console.log(`[GameManager] Action received: ${action?.type}`);
    // Stub - just return current state
    return { success: true, ...this.getPublicState() };
  }

  handleAction(action) {
    console.log(`[GameManager] handleAction called: ${action?.type}`);
    // Stub - just return current state
    return { success: true, ...this.getPublicState() };
  }

  endSession() {
    this.isActive = false;
    this.gameState.phase = 'COMPLETED';
    console.log(`[GameManager] Session ended: ${this.sessionName}`);
    // Emit session ended event
    this.emit('session_ended', {
      sessionName: this.sessionName,
      finalRound: this.currentRound,
      totalRounds: this.totalRounds,
      targetScore: this.targetScore,
      gameLimitType: this.gameLimitType,
      reason: 'OPERATOR_ENDED'
    });
    return this.getPublicState();
  }

  broadcast(event, data) {
    // Broadcast to all players and viewers
    const payload = JSON.stringify({ event, data });
    
    this.players.forEach(player => {
      if (player.socket && player.socket.connected) {
        player.socket.emit(event, data);
      }
    });
    
    this.viewers.forEach(viewer => {
      if (viewer.socket && viewer.socket.connected) {
        viewer.socket.emit(event, data);
      }
    });
  }
}

module.exports = GameManager;

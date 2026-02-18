/**
 * Stub GameManager for platform deployment
 * This is a minimal implementation that allows the platform to function
 * without the full game logic. Games can be implemented later as plugins.
 */

const EventEmitter = require('events');

class GameManager extends EventEmitter {
  constructor(sessionId, sessionName, totalRounds) {
    super();
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.totalRounds = totalRounds;
    this.currentRound = 1;
    this.gameState = {
      players: [],
      gamePlayers: [],
      phase: 'SETUP',
      pot: 0,
      currentBet: 0,
      dealerPosition: 0,
      currentPlayerIndex: 0
    };
    this.players = new Map();
    this.viewers = new Map();
    this.isActive = true;
    this.gameHistory = [];
    
    console.log(`[GameManager] Created for session: ${sessionName}`);
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
    return {
      sessionName: this.sessionName,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      phase: this.gameState.phase,
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
  }

  startRound() {
    console.log(`[GameManager] Round ${this.currentRound} started`);
    this.gameState.phase = 'ACTIVE';
    return this.getPublicState();
  }

  processAction(socketId, action) {
    console.log(`[GameManager] Action received: ${action.type}`);
    // Stub - just return current state
    return this.getPublicState();
  }

  endSession() {
    this.isActive = false;
    this.gameState.phase = 'COMPLETED';
    console.log(`[GameManager] Session ended: ${this.sessionName}`);
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

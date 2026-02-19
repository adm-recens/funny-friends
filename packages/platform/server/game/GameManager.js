const EventEmitter = require('events');

class TeenPattiLedger extends EventEmitter {
    constructor(config, sessionName, totalRounds) {
        super();
        
        if (typeof config === 'object' && config !== null) {
            this.sessionId = config.sessionId;
            this.sessionName = config.sessionName;
            this.gameLimitType = config.gameLimitType || 'rounds';
            this.totalRounds = config.totalRounds || 10;
            this.targetScore = config.targetScore;
        } else {
            this.sessionId = config;
            this.sessionName = sessionName;
            this.totalRounds = totalRounds || 10;
            this.gameLimitType = 'rounds';
        }
        
        this.currentRound = 1;
        this.isActive = true;

        this.gameState = {
            players: [],
            pot: 0,
            currentLogs: [],
            phase: 'SETUP',
            totalRounds: this.totalRounds,
            gameLimitType: this.gameLimitType,
            winner: null
        };
    }

    setPlayers(initialPlayers) {
        this.gameState.players = initialPlayers.map(p => ({
            ...p,
            status: 'PLAYING',
            invested: 0
        }));
        if (!this.gameState.phase || this.gameState.phase === 'SETUP') {
            this.gameState.phase = 'SETUP';
        }
    }

    addPlayer(player) {
        if (this.gameState.phase !== 'SETUP') return false;
        this.gameState.players.push({
            ...player,
            status: 'PLAYING',
            invested: 0
        });
        return true;
    }

    removePlayer(playerId) {
        if (this.gameState.phase !== 'SETUP') return false;
        this.gameState.players = this.gameState.players.filter(p => p.id !== playerId);
        return true;
    }

    startRound() {
        if (this.currentRound > this.totalRounds) {
            this.isActive = false;
            return { success: false, error: "Session complete" };
        }
        
        const validPlayers = this.gameState.players.filter(p => p.name && p.name.trim() !== '');
        
        if (validPlayers.length < 2) return { success: false, error: "Need at least 2 players" };

        this.gameState.pot = 0;
        this.gameState.currentLogs = [
            `Round ${this.currentRound} Started.`,
            `${validPlayers.length} players in game.`
        ];
        this.gameState.phase = 'ACTIVE';
        this.gameState.winner = null;

        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    handleAction(action) {
        if (action.type === 'RECORD_WINNER') {
            return this.recordWinner(action.winnerId, action.potAmount);
        }
        if (action.type === 'ADD_TO_POT') {
            return this.addToPot(action.amount);
        }
        if (action.type === 'RESET_ROUND') {
            return this.resetRound();
        }
        
        return { success: false, error: "Invalid action. Use RECORD_WINNER to record a win." };
    }

    addToPot(amount) {
        if (!amount || amount <= 0) {
            return { success: false, error: "Invalid amount" };
        }
        
        this.gameState.pot += amount;
        this.gameState.currentLogs.push(`Added ${amount} to pot. Total pot: ${this.gameState.pot}`);
        
        this.emit('state_change', this.getPublicState());
        return { success: true, pot: this.gameState.pot };
    }

    recordWinner(winnerId, potAmount = null) {
        const winner = this.gameState.players.find(p => p.id === winnerId);
        
        if (!winner) {
            return { success: false, error: "Winner not found" };
        }

        const pot = potAmount !== null ? potAmount : this.gameState.pot;
        
        this.gameState.winner = winner;
        this.gameState.currentLogs.push(`🏆 ${winner.name} wins ${pot}!`);

        const netChanges = {};
        this.gameState.players.forEach(p => {
            if (p.id === winner.id) {
                netChanges[p.id] = pot;
                p.sessionBalance += pot;
            } else {
                netChanges[p.id] = 0;
            }
        });

        this.currentRound++;
        
        const isSessionOver = this.currentRound > this.totalRounds;

        this.emit('state_change', this.getPublicState());
        
        this.emit('hand_complete', {
            winner,
            pot: pot,
            netChanges,
            currentRound: this.currentRound,
            isSessionOver
        });
        
        if (isSessionOver) {
            this.isActive = false;
            this.emit('session_ended', { 
                reason: 'MAX_ROUNDS_REACHED',
                finalRound: this.currentRound - 1,
                totalRounds: this.totalRounds
            });
        }

        return { success: true, winner, pot, netChanges };
    }

    resetRound() {
        this.gameState.pot = 0;
        this.gameState.winner = null;
        this.gameState.currentLogs.push(`Round ${this.currentRound} reset.`);
        
        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    getPublicState() {
        return {
            players: this.gameState.players,
            pot: this.gameState.pot,
            currentLogs: this.gameState.currentLogs,
            phase: this.gameState.phase,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            gameLimitType: this.gameLimitType,
            winner: this.gameState.winner
        };
    }
}

module.exports = TeenPattiLedger;

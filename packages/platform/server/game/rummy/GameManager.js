const EventEmitter = require('events');

class RummyLedger extends EventEmitter {
    constructor(config, sessionName, totalRounds) {
        super();
        
        if (typeof config === 'object' && config !== null) {
            this.sessionId = config.sessionId;
            this.sessionName = config.sessionName;
            this.gameLimitType = config.gameLimitType || 'points';
            this.targetScore = config.targetScore || 100;
            this.totalRounds = config.totalRounds || 999;
        } else {
            this.sessionId = config;
            this.sessionName = sessionName;
            this.targetScore = 100;
            this.totalRounds = totalRounds || 999;
            this.gameLimitType = 'points';
        }
        
        this.currentRound = 1;
        this.isActive = true;

        this.gameState = {
            players: [],
            currentLogs: [],
            phase: 'SETUP',
            gameLimitType: this.gameLimitType,
            totalRounds: this.totalRounds,
            targetScore: this.targetScore,
            winner: null
        };
    }

    setPlayers(initialPlayers) {
        this.gameState.players = initialPlayers.map(p => ({
            ...p,
            status: 'PLAYING',
            score: 0
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
            score: 0
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
        
        const validPlayers = this.gameState.players.filter(p => p.name && p.name.trim() !== '' && p.status === 'PLAYING');
        
        if (validPlayers.length < 2) return { success: false, error: "Need at least 2 players" };

        this.gameState.currentLogs = [
            `Round ${this.currentRound} Started.`,
            `${validPlayers.length} players in game. Target: ${this.targetScore} points`
        ];
        this.gameState.phase = 'ACTIVE';
        this.gameState.winner = null;

        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    handleAction(action) {
        if (action.type === 'RECORD_POINTS') {
            return this.recordPoints(action.playerId, action.points);
        }
        if (action.type === 'RECORD_DROP') {
            return this.recordDrop(action.playerId, action.dropType);
        }
        if (action.type === 'RECORD_WINNER') {
            return this.recordWinner(action.winnerId);
        }
        if (action.type === 'ELIMINATE_PLAYER') {
            return this.eliminatePlayer(action.playerId);
        }
        if (action.type === 'RESET_ROUND') {
            return this.resetRound();
        }
        
        return { success: false, error: "Invalid action" };
    }

    recordPoints(playerId, points) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }

        player.score += points;
        this.gameState.currentLogs.push(`📝 ${player.name} gets ${points} points. Total: ${player.score}`);

        // Check if player is eliminated
        if (player.score >= this.targetScore + 1) {
            player.status = 'ELIMINATED';
            this.gameState.currentLogs.push(`🚫 ${player.name} is ELIMINATED! (${player.score} points)`);
        }

        this.emit('state_change', this.getPublicState());
        return { success: true, player };
    }

    recordDrop(playerId, dropType) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }

        // Drop types: 'initial' = 20pts, 'middle' = 40pts
        const points = dropType === 'initial' ? 20 : 40;
        
        player.score += points;
        this.gameState.currentLogs.push(`✋ ${player.name} DROPS (${dropType}). Charged: ${points} points. Total: ${player.score}`);

        // Check if player is eliminated
        if (player.score >= this.targetScore + 1) {
            player.status = 'ELIMINATED';
            this.gameState.currentLogs.push(`🚫 ${player.name} is ELIMINATED! (${player.score} points)`);
        }

        this.emit('state_change', this.getPublicState());
        return { success: true, player };
    }

    recordWinner(winnerId) {
        const winner = this.gameState.players.find(p => p.id === winnerId);
        
        if (!winner) {
            return { success: false, error: "Winner not found" };
        }

        this.gameState.winner = winner;
        this.gameState.currentLogs.push(`🏆 ${winner.name} wins Round ${this.currentRound}!`);

        // Check remaining active players
        const activePlayers = this.gameState.players.filter(p => p.status === 'PLAYING');
        const eliminated = this.gameState.players.filter(p => p.status === 'ELIMINATED');
        
        let isSessionOver = false;
        
        if (activePlayers.length <= 1) {
            isSessionOver = true;
            const finalWinner = activePlayers.length === 1 ? activePlayers[0] : winner;
            this.gameState.winner = finalWinner;
            this.gameState.currentLogs.push(`🎉 ${finalWinner.name} WINS THE GAME!`);
        }

        const netChanges = {};
        this.gameState.players.forEach(p => {
            netChanges[p.id] = p.score;
        });

        this.currentRound++;

        this.emit('state_change', this.getPublicState());
        
        this.emit('hand_complete', {
            winner,
            pot: 0,
            netChanges,
            currentRound: this.currentRound,
            isSessionOver,
            eliminated: eliminated.map(p => p.name),
            remainingPlayers: activePlayers.length
        });
        
        if (isSessionOver) {
            this.isActive = false;
            this.emit('session_ended', { 
                reason: 'GAME_COMPLETE',
                finalWinner: this.gameState.winner,
                finalRound: this.currentRound - 1,
                totalRounds: this.totalRounds
            });
        }

        return { success: true, winner };
    }

    eliminatePlayer(playerId) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }

        player.status = 'ELIMINATED';
        this.gameState.currentLogs.push(`🚫 ${player.name} has been ELIMINATED!`);

        // Check if only one player remains
        const activePlayers = this.gameState.players.filter(p => p.status === 'PLAYING');
        
        if (activePlayers.length <= 1) {
            const winner = activePlayers[0] || player;
            this.gameState.winner = winner;
            this.gameState.currentLogs.push(`🎉 ${winner.name} WINS THE GAME!`);
            
            this.isActive = false;
            this.emit('session_ended', { 
                reason: 'GAME_COMPLETE',
                finalWinner: winner,
                finalRound: this.currentRound,
                totalRounds: this.totalRounds
            });
        }

        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    resetRound() {
        this.gameState.winner = null;
        this.gameState.currentLogs.push(`Round ${this.currentRound} reset.`);
        
        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    getPublicState() {
        return {
            players: this.gameState.players,
            currentLogs: this.gameState.currentLogs,
            phase: this.gameState.phase,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            targetScore: this.targetScore,
            gameLimitType: this.gameLimitType,
            winner: this.gameState.winner
        };
    }
}

module.exports = RummyLedger;

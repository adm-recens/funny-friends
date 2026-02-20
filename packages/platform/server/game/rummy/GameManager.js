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
            winner: null,
            roundInProgress: false
        };
    }

    setPlayers(initialPlayers) {
        this.gameState.players = initialPlayers.map(p => ({
            ...p,
            status: 'PLAYING',
            score: 0,
            roundScore: 0  // Score for current round only
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
            score: 0,
            roundScore: 0
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

        // Reset round scores
        this.gameState.players.forEach(p => {
            if (p.status === 'PLAYING') {
                p.roundScore = 0;
            }
        });

        this.gameState.currentLogs = [
            `🎴 Round ${this.currentRound} Started.`,
            `${validPlayers.length} players in game. Target: ${this.targetScore} points`,
            `Cards dealt to all players.`
        ];
        this.gameState.phase = 'ACTIVE';
        this.gameState.winner = null;
        this.gameState.roundInProgress = true;

        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    handleAction(action) {
        switch (action.type) {
            case 'RECORD_INITIAL_DROP':
                return this.recordInitialDrop(action.playerId);
            case 'RECORD_MIDDLE_DROP':
                return this.recordMiddleDrop(action.playerId);
            case 'RECORD_VALID_SHOW':
                return this.recordValidShow(action.playerId);
            case 'RECORD_WRONG_SHOW':
                return this.recordWrongShow(action.playerId);
            case 'RECORD_CARD_POINTS':
                return this.recordCardPoints(action.playerId, action.points);
            case 'RECORD_WINNER':
                return this.recordWinner(action.winnerId);
            case 'END_ROUND':
                return this.endRound();
            case 'RESET_ROUND':
                return this.resetRound();
            default:
                return { success: false, error: "Invalid action" };
        }
    }

    // Initial Drop: Player drops before first draw = 20 points
    recordInitialDrop(playerId) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }
        if (player.status !== 'PLAYING') {
            return { success: false, error: "Player is not active" };
        }
        if (!this.gameState.roundInProgress) {
            return { success: false, error: "No round in progress" };
        }

        const points = 20;
        player.roundScore = points;
        player.score += points;
        
        this.gameState.currentLogs.push(`✋ ${player.name} INITIAL DROP (before first draw). Charged: ${points} points. Total: ${player.score}`);

        // Check elimination
        this.checkElimination(player);
        
        this.emit('state_change', this.getPublicState());
        return { success: true, player, points };
    }

    // Middle Drop: Player drops after playing some = 40 points
    recordMiddleDrop(playerId) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }
        if (player.status !== 'PLAYING') {
            return { success: false, error: "Player is not active" };
        }
        if (!this.gameState.roundInProgress) {
            return { success: false, error: "No round in progress" };
        }

        const points = 40;
        player.roundScore = points;
        player.score += points;
        
        this.gameState.currentLogs.push(`✋ ${player.name} MIDDLE DROP (after playing). Charged: ${points} points. Total: ${player.score}`);

        // Check elimination
        this.checkElimination(player);
        
        this.emit('state_change', this.getPublicState());
        return { success: true, player, points };
    }

    // Valid Show: Player declares rummy correctly = 0 points, round ends
    recordValidShow(playerId) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }
        if (player.status !== 'PLAYING') {
            return { success: false, error: "Player is not active" };
        }
        if (!this.gameState.roundInProgress) {
            return { success: false, error: "No round in progress" };
        }

        player.roundScore = 0;
        // Don't add to total score (remains 0 for this round)
        
        this.gameState.currentLogs.push(`🎉 ${player.name} declares VALID RUMMY! 0 points. Round ends.`);
        
        // End the round immediately
        return this.endRoundWithWinner(player);
    }

    // Wrong Show: Player declares wrongly = 80 points penalty, round ends
    recordWrongShow(playerId) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }
        if (player.status !== 'PLAYING') {
            return { success: false, error: "Player is not active" };
        }
        if (!this.gameState.roundInProgress) {
            return { success: false, error: "No round in progress" };
        }

        const points = 80;
        player.roundScore = points;
        player.score += points;
        
        this.gameState.currentLogs.push(`❌ ${player.name} WRONG SHOW! Penalty: ${points} points. Total: ${player.score}`);
        
        // Check elimination
        this.checkElimination(player);
        
        // End the round immediately
        return this.endRoundWithWinner(null); // No winner this round
    }

    // Record card points for a player (when someone else declares)
    recordCardPoints(playerId, points) {
        const player = this.gameState.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }
        if (player.status !== 'PLAYING') {
            return { success: false, error: "Player is not active" };
        }
        if (!this.gameState.roundInProgress) {
            return { success: false, error: "No round in progress" };
        }

        player.roundScore = points;
        player.score += points;
        
        this.gameState.currentLogs.push(`📝 ${player.name} card points: ${points}. Total: ${player.score}`);

        // Check elimination
        this.checkElimination(player);
        
        this.emit('state_change', this.getPublicState());
        return { success: true, player, points };
    }

    // Helper: Check if player should be eliminated
    checkElimination(player) {
        if (player.score >= this.targetScore + 1) {
            player.status = 'ELIMINATED';
            this.gameState.currentLogs.push(`🚫 ${player.name} is ELIMINATED! (${player.score} points)`);
        }
    }

    // End round with a specific winner
    endRoundWithWinner(winner) {
        this.gameState.roundInProgress = false;
        
        if (winner) {
            this.gameState.winner = winner;
        }

        // Create leaderboard (sorted by score, lowest is better)
        const leaderboard = this.gameState.players
            .filter(p => p.status !== 'ELIMINATED' || p.roundScore > 0)
            .map(p => ({
                id: p.id,
                name: p.name,
                roundScore: p.roundScore,
                totalScore: p.score,
                status: p.status
            }))
            .sort((a, b) => a.totalScore - b.totalScore);

        // Check remaining active players
        const activePlayers = this.gameState.players.filter(p => p.status === 'PLAYING');
        
        let isSessionOver = false;
        let finalWinner = null;
        
        if (activePlayers.length <= 1) {
            isSessionOver = true;
            finalWinner = activePlayers.length === 1 ? activePlayers[0] : null;
            if (finalWinner) {
                this.gameState.winner = finalWinner;
                this.gameState.currentLogs.push(`🏆 ${finalWinner.name} WINS THE GAME! Last player standing.`);
            }
        }

        this.gameState.currentLogs.push(`📊 Round ${this.currentRound} complete!`);
        this.gameState.currentLogs.push(`📈 Leaderboard: ${leaderboard.map(p => `${p.name}(${p.totalScore})`).join(', ')}`);

        this.emit('state_change', this.getPublicState());
        
        this.emit('round_complete', {
            round: this.currentRound,
            winner: winner,
            leaderboard: leaderboard,
            isSessionOver,
            finalWinner
        });
        
        if (isSessionOver) {
            this.isActive = false;
            this.emit('session_ended', { 
                reason: 'GAME_COMPLETE',
                finalWinner: this.gameState.winner,
                finalRound: this.currentRound,
                leaderboard: leaderboard
            });
        }

        return { success: true, winner, leaderboard };
    }

    // Manual round end (operator ends round)
    endRound() {
        if (!this.gameState.roundInProgress) {
            return { success: false, error: "No round in progress" };
        }

        this.gameState.roundInProgress = false;
        this.currentRound++;

        this.gameState.currentLogs.push(`⏹️ Round ended by operator.`);

        // Create leaderboard
        const leaderboard = this.gameState.players
            .map(p => ({
                id: p.id,
                name: p.name,
                roundScore: p.roundScore,
                totalScore: p.score,
                status: p.status
            }))
            .sort((a, b) => a.totalScore - b.totalScore);

        this.emit('state_change', this.getPublicState());
        
        return { success: true, leaderboard };
    }

    // Legacy method for compatibility
    recordWinner(winnerId) {
        const winner = this.gameState.players.find(p => p.id === winnerId);
        if (!winner) {
            return { success: false, error: "Winner not found" };
        }
        return this.endRoundWithWinner(winner);
    }

    resetRound() {
        this.gameState.players.forEach(p => {
            p.roundScore = 0;
        });
        this.gameState.winner = null;
        this.gameState.roundInProgress = false;
        this.gameState.currentLogs.push(`🔄 Round ${this.currentRound} reset.`);
        
        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    endSession() {
        this.isActive = false;
        this.gameState.phase = 'ENDED';
        
        const finalLeaderboard = this.gameState.players
            .map(p => ({
                id: p.id,
                name: p.name,
                finalScore: p.score,
                status: p.status
            }))
            .sort((a, b) => a.finalScore - b.finalScore);
        
        this.emit('session_ended', {
            reason: 'MANUAL_END',
            finalRound: this.currentRound,
            leaderboard: finalLeaderboard
        });
    }

    getPublicState() {
        // Create leaderboard sorted by score
        const leaderboard = this.gameState.players
            .map(p => ({
                id: p.id,
                name: p.name,
                roundScore: p.roundScore || 0,
                totalScore: p.score,
                status: p.status
            }))
            .sort((a, b) => a.totalScore - b.totalScore);

        // Find first active player for turn indication
        const activePlayerIndex = this.gameState.players.findIndex(p => p.status === 'PLAYING');

        return {
            players: this.gameState.players,
            gamePlayers: this.gameState.players, // For frontend compatibility
            leaderboard: leaderboard,
            currentLogs: this.gameState.currentLogs,
            phase: this.gameState.phase,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            targetScore: this.targetScore,
            gameLimitType: this.gameLimitType,
            winner: this.gameState.winner,
            roundInProgress: this.gameState.roundInProgress,
            activePlayerIndex: activePlayerIndex >= 0 ? activePlayerIndex : 0
        };
    }
}

module.exports = RummyLedger;

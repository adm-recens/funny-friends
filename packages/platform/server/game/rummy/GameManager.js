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
        this.gameState.roundCompletionPhase = false;
        this.gameState.rummyDeclaredBy = null;
        this.gameState.wrongShowBy = null;

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
        
        // Check if only one player remains (auto-win)
        this.checkAutoWin();
        
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
        
        // Check if only one player remains (auto-win)
        this.checkAutoWin();
        
        this.emit('state_change', this.getPublicState());
        return { success: true, player, points };
    }

    // Check if only one non-dropped player remains (auto-win scenario)
    checkAutoWin() {
        const activePlayers = this.gameState.players.filter(p => p.status === 'PLAYING');
        const playersNotDropped = activePlayers.filter(p => p.roundScore === 0);
        
        // If only one player hasn't dropped and no one has declared rummy yet
        if (playersNotDropped.length === 1 && !this.gameState.rummyDeclaredBy && !this.gameState.wrongShowBy) {
            const lastPlayer = playersNotDropped[0];
            this.gameState.rummyDeclaredBy = lastPlayer;
            this.gameState.roundCompletionPhase = true;
            this.gameState.currentLogs.push(`🏆 ${lastPlayer.name} wins automatically! (All others dropped)`);
            
            // Auto-end the round since everyone else has dropped
            setTimeout(() => {
                this.endRoundWithWinner(lastPlayer);
            }, 1000);
        }
    }

    // Rummy: Player declares rummy correctly = 0 points, round enters completion phase
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
        this.gameState.rummyDeclaredBy = player;
        this.gameState.roundCompletionPhase = true;
        
        this.gameState.currentLogs.push(`🎉 ${player.name} declares RUMMY! 0 points. Waiting for remaining players' points.`);
        
        // Check if all other players have been eliminated or have points
        this.checkRoundCompletion();
        
        this.emit('state_change', this.getPublicState());
        return { success: true, player, message: "Rummy declared. Add points for remaining players." };
    }

    // Wrong Show: Player declares wrongly = 80 points penalty, round enters completion phase
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
        
        this.gameState.wrongShowBy = player;
        this.gameState.roundCompletionPhase = true;
        
        this.gameState.currentLogs.push(`❌ ${player.name} WRONG SHOW! Penalty: ${points} points. Waiting for remaining players' points.`);
        
        // Check elimination
        this.checkElimination(player);
        
        // Check if all other players have been eliminated or have points
        this.checkRoundCompletion();
        
        this.emit('state_change', this.getPublicState());
        return { success: true, player, message: "Wrong show. Add points for remaining players." };
    }
    
    // Check if round can be completed (all players have scores or are eliminated)
    checkRoundCompletion() {
        const activePlayers = this.gameState.players.filter(p => p.status === 'PLAYING');
        const playersWithScore = activePlayers.filter(p => p.roundScore > 0 || p.roundScore === 0);
        const rummyDeclarers = this.gameState.rummyDeclaredBy ? [this.gameState.rummyDeclaredBy] : [];
        
        // Check if only one player remains and everyone else dropped
        const nonDroppedPlayers = activePlayers.filter(p => p.roundScore === 0 && !this.gameState.rummyDeclaredBy);
        
        if (nonDroppedPlayers.length === 1 && activePlayers.length > 1) {
            // Last player auto-wins with 0 points if everyone else dropped
            const lastPlayer = nonDroppedPlayers[0];
            if (!this.gameState.rummyDeclaredBy) {
                this.gameState.rummyDeclaredBy = lastPlayer;
                this.gameState.currentLogs.push(`🏆 ${lastPlayer.name} wins automatically! (All others dropped)`);
            }
        }
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
        if (!this.gameState.roundInProgress && !this.gameState.roundCompletionPhase) {
            return { success: false, error: "No round in progress" };
        }
        
        // Determine winner
        let winner = this.gameState.rummyDeclaredBy;
        
        // If no rummy declared, find player with lowest round score
        if (!winner) {
            const activePlayers = this.gameState.players.filter(p => p.status === 'PLAYING');
            if (activePlayers.length > 0) {
                winner = activePlayers.reduce((min, p) => p.roundScore < min.roundScore ? p : min, activePlayers[0]);
            }
        }

        this.gameState.currentLogs.push(`⏹️ Round ${this.currentRound} completed by operator.`);
        
        // End the round properly
        return this.endRoundWithWinner(winner);
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
        this.gameState.roundCompletionPhase = false;
        this.gameState.rummyDeclaredBy = null;
        this.gameState.wrongShowBy = null;
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

        // Determine if we're waiting for points from remaining players
        const activePlayers = this.gameState.players.filter(p => p.status === 'PLAYING');
        const playersNeedingPoints = activePlayers.filter(p => {
            // Player needs points if they haven't been assigned any AND they didn't declare rummy or wrong show
            const isDeclarer = this.gameState.rummyDeclaredBy?.id === p.id || this.gameState.wrongShowBy?.id === p.id;
            const hasPoints = p.roundScore > 0 || (p.roundScore === 0 && isDeclarer);
            return !isDeclarer && !hasPoints;
        });

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
            roundCompletionPhase: this.gameState.roundCompletionPhase,
            rummyDeclaredBy: this.gameState.rummyDeclaredBy,
            wrongShowBy: this.gameState.wrongShowBy,
            playersNeedingPoints: playersNeedingPoints.length,
            activePlayerIndex: activePlayerIndex >= 0 ? activePlayerIndex : 0
        };
    }
}

module.exports = RummyLedger;

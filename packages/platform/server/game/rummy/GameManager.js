const EventEmitter = require('events');

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUES = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ 
                suit, 
                rank, 
                value: RANK_VALUES[rank],
                isJoker: false,
                id: `${rank}${suit}`
            });
        }
    }
    // Add wild jokers
    for (let i = 0; i < 2; i++) {
        deck.push({
            suit: '★',
            rank: 'JOKER',
            value: 0,
            isJoker: true,
            isWildJoker: true,
            id: `WILD_JOKER_${i}`
        });
    }
    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function canUseAsJoker(card, wildJokerRank) {
    if (card.isWildJoker) return true;
    if (card.rank === wildJokerRank) return true;
    return false;
}

function validateSet(cards, wildJokerRank) {
    if (cards.length < 3) return false;
    
    const nonJokers = cards.filter(c => !c.isJoker && !canUseAsJoker(c, wildJokerRank));
    const jokers = cards.filter(c => c.isJoker || canUseAsJoker(c, wildJokerRank));
    
    if (nonJokers.length === 0) return true;
    
    const ranks = nonJokers.map(c => c.rank);
    const uniqueRanks = [...new Set(ranks)];
    
    if (uniqueRanks.length !== 1) return false;
    if (nonJokers.length + jokers.length < 3) return false;
    
    return true;
}

function validateSequence(cards, wildJokerRank, requirePure = false) {
    if (cards.length < 3) return false;
    
    const nonJokers = cards.filter(c => !c.isJoker && !canUseAsJoker(c, wildJokerRank));
    const jokers = cards.filter(c => c.isJoker || canUseAsJoker(c, wildJokerRank));
    
    if (nonJokers.length === 0) return true;
    
    const suits = nonJokers.map(c => c.suit);
    const uniqueSuits = [...new Set(suits)];
    if (uniqueSuits.length !== 1) return false;
    
    // If pure sequence required and jokers used, not valid
    if (requirePure && jokers.length > 0) return false;
    
    const sorted = [...nonJokers].sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
    const indices = sorted.map(c => RANKS.indexOf(c.rank));
    
    let expectedIdx = indices[0];
    let jokerUsed = 0;
    
    for (let i = 1; i < sorted.length; i++) {
        const currIdx = RANKS.indexOf(sorted[i].rank);
        const gap = currIdx - expectedIdx;
        
        if (gap === 0) {
            expectedIdx++;
            continue;
        }
        
        if (gap > 0 && gap <= (jokers.length - jokerUsed)) {
            jokerUsed += gap;
            expectedIdx = currIdx + 1;
            continue;
        }
        
        return false;
    }
    
    return true;
}

function findPureSequences(hand, wildJokerRank) {
    // Find all possible pure sequences in hand
    const sequences = [];
    const suits = ['♠', '♥', '♦', '♣'];
    
    for (const suit of suits) {
        const suitCards = hand.filter(c => c.suit === suit && !c.isJoker && !canUseAsJoker(c, wildJokerRank));
        suitCards.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
        
        // Find consecutive runs
        if (suitCards.length >= 3) {
            let start = 0;
            for (let i = 1; i <= suitCards.length; i++) {
                if (i === suitCards.length || RANKS.indexOf(suitCards[i].rank) !== RANKS.indexOf(suitCards[i-1].rank) + 1) {
                    if (i - start >= 3) {
                        sequences.push(suitCards.slice(start, i));
                    }
                    start = i;
                }
            }
        }
    }
    
    return sequences;
}

function calculateHandPoints(hand, wildJokerRank, excludePureSequence = true) {
    let total = 0;
    const used = new Set();
    
    // Find and exclude pure sequence first
    const pureSequences = findPureSequences(hand, wildJokerRank);
    
    // Mark cards used in pure sequences
    if (excludePureSequence && pureSequences.length > 0) {
        // Use the first pure sequence found
        pureSequences[0].forEach(c => used.add(c.id));
    }
    
    // Calculate remaining cards
    const remaining = hand.filter(c => !used.has(c.id));
    
    for (const card of remaining) {
        if (card.isWildJoker) continue;
        total += card.value || 0;
    }
    
    return total;
}

function validateFullHand(hand, wildJokerRank) {
    const result = {
        isValid: false,
        pureSequence: false,
        totalValue: 0,
        error: null
    };
    
    if (!hand || hand.length !== 13) {
        result.error = `Need 13 cards, have ${hand?.length || 0}`;
        return result;
    }
    
    // Check for pure sequence
    const pureSequences = findPureSequences(hand, wildJokerRank);
    result.pureSequence = pureSequences.length > 0;
    
    if (!result.pureSequence) {
        result.error = "Need at least one pure sequence (3+ consecutive cards of same suit)";
        return result;
    }
    
    // Calculate points (excluding pure sequence)
    result.totalValue = calculateHandPoints(hand, wildJokerRank, true);
    
    // For now, any hand with pure sequence is considered valid for declaration
    result.isValid = true;
    
    return result;
}

class RummyGameManager extends EventEmitter {
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
        this.wildJokerRank = null;

        this.gameState = {
            players: [],
            drawPile: [],
            discardPile: [],
            closedJoker: null,
            currentPlayerIndex: 0,
            phase: 'SETUP', // SETUP, DROP_PHASE, PLAY, DECLARE, SHOWDOWN, ENDED
            currentLogs: [],
            gameLimitType: this.gameLimitType,
            totalRounds: this.totalRounds,
            targetScore: this.targetScore,
            droppedPlayers: [],
            wildJokerRank: null,
            winner: null,
            declaredPlayer: null,
            declaredValid: false
        };
    }

    setPlayers(initialPlayers) {
        this.gameState.players = initialPlayers.map(p => ({
            ...p,
            hand: [],
            status: 'PLAYING',
            score: 0,
            dropped: false,
            dropPhase: null // 'initial' or 'middle'
        }));
        if (!this.gameState.phase || this.gameState.phase === 'SETUP') {
            this.gameState.phase = 'SETUP';
        }
    }

    addPlayer(player) {
        if (this.gameState.phase !== 'SETUP') return false;
        this.gameState.players.push({
            ...player,
            hand: [],
            status: 'PLAYING',
            score: 0,
            dropped: false
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

        // Reset players for new round
        validPlayers.forEach(p => {
            p.status = 'PLAYING';
            p.score = p.score || 0;
            p.dropped = false;
            p.dropPhase = null;
            p.hand = [];
        });

        const deck = shuffleDeck(createDeck());
        let deckIndex = 0;

        // Deal 13 cards to each player
        const cardsForPlayers = validPlayers.length * 13;
        
        // Closed joker is at position after player cards
        const closedJokerCard = deck[cardsForPlayers];
        
        // Draw pile is after closed joker
        this.gameState.drawPile = deck.slice(cardsForPlayers + 1);

        // Set closed joker
        this.wildJokerRank = closedJokerCard?.rank || 'A';
        this.gameState.wildJokerRank = this.wildJokerRank;
        this.gameState.closedJoker = closedJokerCard;

        // Initialize discard pile
        this.gameState.discardPile = [];

        this.gameState.gamePlayers = validPlayers.map(p => {
            const hand = [];
            for (let i = 0; i < 13; i++) {
                hand.push(deck[deckIndex++]);
            }
            hand.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
            return {
                ...p,
                hand: hand,
                status: 'PLAYING',
                dropped: false,
                hasShownClosedJoker: false
            };
        });

        this.gameState.currentPlayerIndex = 0;
        this.gameState.droppedPlayers = [];
        this.gameState.currentLogs = [
            `Round ${this.currentRound} Started.`,
            `Wild Joker: ${this.wildJokerRank}`,
            `Closed Joker: ${this.wildJokerRank}`,
            `${validPlayers.length} players. Drop in initial phase = 20pts, Middle = 40pts`
        ];
        this.gameState.phase = 'DROP_PHASE';
        this.gameState.winner = null;
        this.gameState.declaredPlayer = null;

        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    handleAction(action) {
        if (action.type === 'DROP_PLAYER') {
            return this.dropPlayer(action.playerId, action.phase);
        }
        if (action.type === 'DRAW_CARD') {
            return this.drawCard(action.playerId, action.source);
        }
        if (action.type === 'DISCARD_CARD') {
            return this.discardCard(action.playerId, action.cardId);
        }
        if (action.type === 'SHOW_CLOSED_JOKER') {
            return this.showClosedJoker(action.playerId);
        }
        if (action.type === 'DECLARE_RUMMY') {
            return this.declareRummy(action.playerId);
        }
        if (action.type === 'RESOLVE_DECLARE') {
            return this.resolveDeclare(action.winnerId, action.isValid);
        }
        
        return { success: false, error: "Invalid action" };
    }

    dropPlayer(playerId, phase) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }

        if (player.dropped) {
            return { success: false, error: "Already dropped" };
        }

        // Determine drop charge
        let charge = 0;
        if (phase === 'initial' || this.gameState.phase === 'DROP_PHASE') {
            charge = 20;
            player.dropPhase = 'initial';
        } else {
            charge = 40;
            player.dropPhase = 'middle';
        }

        player.dropped = true;
        player.score += charge;
        
        this.gameState.droppedPlayers.push({
            name: player.name,
            points: charge,
            phase: player.dropPhase
        });

        this.gameState.currentLogs.push(
            `✋ ${player.name} DROPS in ${player.dropPhase} phase! Charged: ${charge} points`
        );

        // Check remaining players who haven't dropped
        const activePlayers = this.gameState.gamePlayers.filter(p => !p.dropped);
        
        if (activePlayers.length === 0) {
            // Everyone dropped - round ends
            this.gameState.currentLogs.push(`📍 All players dropped! Round ends.`);
            return this.endRound();
        }
        
        // Move to next player (skip dropped players)
        this.moveToNextActivePlayer();
        
        // Check if DROP_PHASE should end
        // It ends when current player has already taken a turn (has dropPhase)
        const currentPlayer = this.gameState.gamePlayers[this.gameState.currentPlayerIndex];
        
        // If we've come back to a player who already had their drop chance, end DROP_PHASE
        if (currentPlayer.dropPhase) {
            // Everyone has had a chance to drop
            if (activePlayers.length === 1) {
                // Only one player left - they win by default
                const winner = activePlayers[0];
                this.gameState.winner = winner;
                this.gameState.currentLogs.push(`🏆 ${winner.name} wins by default! All others dropped.`);
                return this.endRound();
            } else {
                // Move to play phase
                this.gameState.phase = 'PLAY';
                this.gameState.currentLogs.push(`🎮 All initial drops done. Game Phase: PLAY`);
            }
        }

        this.emit('state_change', this.getPublicState());
        
        // Check for eliminations
        this.checkEliminations();
        
        return { success: true, charge };
    }

    drawCard(playerId, source = 'draw') {
        const activePlayer = this.gameState.gamePlayers[this.gameState.currentPlayerIndex];
        
        if (!activePlayer || activePlayer.id !== playerId) {
            return { success: false, error: "Not your turn" };
        }

        if (activePlayer.dropped) {
            return { success: false, error: "You have already dropped" };
        }

        if (this.gameState.phase !== 'DROP_PHASE' && this.gameState.phase !== 'PLAY') {
            return { success: false, error: "Cannot draw now" };
        }

        // If in DROP_PHASE and player draws, they commit to playing
        if (this.gameState.phase === 'DROP_PHASE') {
            this.gameState.phase = 'PLAY';
            this.gameState.currentLogs.push(`🎮 Game Phase: PLAY`);
        }

        let card;
        if (source === 'discard') {
            if (this.gameState.discardPile.length === 0) {
                return { success: false, error: "Discard pile is empty" };
            }
            card = this.gameState.discardPile.pop();
            this.gameState.currentLogs.push(`${activePlayer.name} picks from discard: ${card.rank}${card.suit}`);
        } else {
            if (this.gameState.drawPile.length === 0) {
                return { success: false, error: "Draw pile is empty" };
            }
            card = this.gameState.drawPile.pop();
            this.gameState.currentLogs.push(`${activePlayer.name} draws a card`);
        }

        activePlayer.hand.push(card);
        activePlayer.hand.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));

        this.emit('state_change', this.getPublicState());
        
        return { success: true, card };
    }

    discardCard(playerId, cardId) {
        const activePlayer = this.gameState.gamePlayers[this.gameState.currentPlayerIndex];
        
        if (!activePlayer || activePlayer.id !== playerId) {
            return { success: false, error: "Not your turn" };
        }

        if (activePlayer.dropped) {
            return { success: false, error: "You have dropped" };
        }

        const cardIndex = activePlayer.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, error: "Card not in hand" };
        }

        const [card] = activePlayer.hand.splice(cardIndex, 1);
        this.gameState.discardPile.push(card);
        
        this.gameState.currentLogs.push(`${activePlayer.name} discards: ${card.rank}${card.suit}`);

        this.moveToNextPlayer();
        
        this.emit('state_change', this.getPublicState());
        
        return { success: true };
    }

    showClosedJoker(playerId) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }

        // Check if player has pure sequence
        const hasPureSequence = findPureSequences(player.hand, this.wildJokerRank).length > 0;
        
        if (!hasPureSequence) {
            return { success: false, error: "Need a pure sequence to see closed joker" };
        }

        player.hasShownClosedJoker = true;
        
        // Add closed joker to player's available jokers
        const closedJoker = {
            suit: '★',
            rank: this.wildJokerRank,
            value: 0,
            isJoker: true,
            isClosedJoker: true,
            id: 'CLOSED_JOKER'
        };
        
        // For validation purposes, treat closed joker as usable
        this.gameState.currentLogs.push(`👁️ ${player.name} shows pure sequence and sees Closed Joker: ${this.wildJokerRank}`);

        this.emit('state_change', this.getPublicState());
        
        return { success: true, wildJoker: this.wildJokerRank };
    }

    declareRummy(playerId) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }

        if (player.dropped) {
            return { success: false, error: "You have dropped" };
        }

        const validation = validateFullHand(player.hand, this.wildJokerRank);
        
        this.gameState.declaredPlayer = player;
        this.gameState.declaredValid = validation.isValid;
        
        if (validation.isValid) {
            this.gameState.currentLogs.push(`🎉 ${player.name} declares RUMMY! (Valid: ${validation.totalValue} pts)`);
        } else {
            this.gameState.currentLogs.push(`⚠️ ${player.name} declares RUMMY but INVALID: ${validation.error}`);
        }

        this.gameState.phase = 'SHOWDOWN';
        
        this.emit('state_change', this.getPublicState());
        
        return { 
            success: true, 
            isValid: validation.isValid, 
            totalPoints: validation.totalValue,
            player: player
        };
    }

    resolveDeclare(winnerId, isValid) {
        if (!this.gameState.declaredPlayer) {
            return { success: false, error: "No pending declaration" };
        }

        const declarer = this.gameState.declaredPlayer;
        
        if (isValid) {
            // Declarer wins - gets 0, others get charged
            this.gameState.winner = declarer;
            this.gameState.currentLogs.push(`✅ ${declarer.name}'s declaration is VALID! Wins with ${calculateHandPoints(declarer.hand, this.wildJokerRank, true)} points.`);
            
            // Charge all other active players
            this.gameState.gamePlayers.forEach(p => {
                if (!p.dropped && p.id !== declarer.id) {
                    const points = calculateHandPoints(p.hand, this.wildJokerRank, false);
                    p.score += points;
                    this.gameState.currentLogs.push(`📝 ${p.name} charged ${points} points for ${p.hand.length} cards`);
                }
            });
        } else {
            // Wrong show - declarer gets 80 penalty
            const penalty = 80;
            declarer.score += penalty;
            this.gameState.winner = this.gameState.gamePlayers.find(p => !p.dropped && p.id !== declarer.id) || declarer;
            this.gameState.currentLogs.push(`❌ ${declarer.name}'s declaration is INVALID! Wrong Show! Charged ${penalty} points.`);
            
            // Other players might get charged too
            this.gameState.gamePlayers.forEach(p => {
                if (!p.dropped && p.id !== declarer.id) {
                    const points = calculateHandPoints(p.hand, this.wildJokerRank, false);
                    p.score += points;
                    this.gameState.currentLogs.push(`📝 ${p.name} charged ${points} points`);
                }
            });
        }

        return this.endRound();
    }

    moveToNextPlayer() {
        let attempts = 0;
        let nextIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.gamePlayers.length;
        
        while (attempts < this.gameState.gamePlayers.length) {
            if (!this.gameState.gamePlayers[nextIndex].dropped) {
                break;
            }
            nextIndex = (nextIndex + 1) % this.gameState.gamePlayers.length;
            attempts++;
        }
        
        this.gameState.currentPlayerIndex = nextIndex;
    }

    moveToNextActivePlayer() {
        let attempts = 0;
        let nextIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.gamePlayers.length;
        
        while (attempts < this.gameState.gamePlayers.length) {
            const p = this.gameState.gamePlayers[nextIndex];
            if (!p.dropped) {
                this.gameState.currentPlayerIndex = nextIndex;
                return;
            }
            nextIndex = (nextIndex + 1) % this.gameState.gamePlayers.length;
            attempts++;
        }
    }

    checkEliminations() {
        const eliminated = [];
        
        this.gameState.gamePlayers.forEach(p => {
            if (p.score >= this.targetScore + 1 && p.status !== 'ELIMINATED') {
                p.status = 'ELIMINATED';
                eliminated.push(p.name);
            }
        });

        if (eliminated.length > 0) {
            this.gameState.currentLogs.push(`🚫 ELIMINATED: ${eliminated.join(', ')} (Target: ${this.targetScore}+)`);
        }
    }

    endRound() {
        this.gameState.phase = 'ENDED';
        
        // Update main player list scores
        this.gameState.players.forEach(mainPlayer => {
            const gamePlayer = this.gameState.gamePlayers.find(p => p.id === mainPlayer.id);
            if (gamePlayer) {
                mainPlayer.score = gamePlayer.score;
            }
        });

        // Check for eliminations
        this.checkEliminations();

        // Check remaining players
        const remaining = this.gameState.gamePlayers.filter(p => p.status === 'PLAYING' && !p.dropped);
        
        this.currentRound++;
        
        const isSessionOver = remaining.length <= 1 || this.currentRound > this.totalRounds;

        // Sort by score (ascending)
        const leaderboard = [...this.gameState.players]
            .filter(p => p.status !== 'GUEST')
            .sort((a, b) => a.score - b.score);

        this.emit('state_change', this.getPublicState());
        
        this.emit('hand_complete', {
            winner: this.gameState.winner,
            pot: 0,
            netChanges: this.gameState.players.reduce((acc, p) => { acc[p.id] = p.score; return acc; }, {}),
            currentRound: this.currentRound,
            isSessionOver,
            leaderboard,
            droppedPlayers: this.gameState.droppedPlayers
        });

        if (isSessionOver) {
            this.isActive = false;
            const finalWinner = remaining.length === 1 ? remaining[0] : leaderboard[0];
            this.emit('session_ended', {
                reason: 'GAME_COMPLETE',
                finalWinner,
                finalRound: this.currentRound - 1,
                totalRounds: this.totalRounds,
                leaderboard
            });
        }

        return { success: true };
    }

    getPublicState() {
        const publicGamePlayers = this.gameState.gamePlayers.map(p => {
            const { hand, ...publicPlayer } = p;
            return publicPlayer;
        });

        return {
            players: this.gameState.players,
            gamePlayers: publicGamePlayers,
            drawPileCount: this.gameState.drawPile.length,
            discardPile: this.gameState.discardPile.slice(-3),
            closedJoker: this.gameState.closedJoker,
            currentPlayerIndex: this.gameState.currentPlayerIndex,
            currentLogs: this.gameState.currentLogs,
            phase: this.gameState.phase,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            targetScore: this.targetScore,
            gameLimitType: this.gameLimitType,
            wildJokerRank: this.wildJokerRank,
            winner: this.gameState.winner,
            declaredPlayer: this.gameState.declaredPlayer,
            declaredValid: this.gameState.declaredValid,
            droppedPlayers: this.gameState.droppedPlayers
        };
    }

    getPlayerHand(playerId) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        if (!player) return null;
        
        return {
            hand: player.hand,
            wildJokerRank: this.wildJokerRank,
            validation: validateFullHand(player.hand, this.wildJokerRank),
            hasPureSequence: findPureSequences(player.hand, this.wildJokerRank).length > 0,
            canShowClosedJoker: findPureSequences(player.hand, this.wildJokerRank).length > 0 && !player.hasShownClosedJoker
        };
    }
}

module.exports = RummyGameManager;

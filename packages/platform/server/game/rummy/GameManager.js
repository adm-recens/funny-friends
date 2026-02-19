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
    // Add printed jokers (any card can be chosen as joker)
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

function isSameRank(cards) {
    if (cards.length < 3) return false;
    const ranks = cards.map(c => c.rank);
    return ranks.every(r => r === ranks[0]);
}

function isConsecutive(cards) {
    if (cards.length < 3) return false;
    const sorted = [...cards].sort((a, b) => {
        const aIdx = RANKS.indexOf(a.rank);
        const bIdx = RANKS.indexOf(b.rank);
        return aIdx - bIdx;
    });
    
    for (let i = 1; i < sorted.length; i++) {
        const currIdx = RANKS.indexOf(sorted[i].rank);
        const prevIdx = RANKS.indexOf(sorted[i-1].rank);
        if (currIdx !== prevIdx + 1) return false;
    }
    return true;
}

function isSameSuit(cards) {
    if (cards.length < 3) return false;
    const suits = cards.map(c => c.suit);
    return suits.every(s => s === suits[0]);
}

function canUseAsJoker(card, wildJokerRank) {
    if (card.isWildJoker) return true;
    if (card.rank === wildJokerRank) return true;
    return false;
}

function evaluateSet(cards, wildJokerRank) {
    if (cards.length < 3) return false;
    
    const nonJokers = cards.filter(c => !c.isJoker && !canUseAsJoker(c, wildJokerRank));
    const jokers = cards.filter(c => c.isJoker || canUseAsJoker(c, wildJokerRank));
    
    if (nonJokers.length === 0) return true; // All jokers
    
    const ranks = nonJokers.map(c => c.rank);
    const uniqueRanks = [...new Set(ranks)];
    
    if (uniqueRanks.length !== 1) return false;
    if (nonJokers.length + jokers.length < 3) return false;
    
    return true;
}

function evaluateSequence(cards, wildJokerRank, allowJokers = true) {
    if (cards.length < 3) return false;
    
    const nonJokers = cards.filter(c => !c.isJoker && !canUseAsJoker(c, wildJokerRank));
    const jokers = cards.filter(c => c.isJoker || canUseAsJoker(c, wildJokerRank));
    
    if (nonJokers.length === 0) return true;
    
    const suits = nonJokers.map(c => c.suit);
    const uniqueSuits = [...new Set(suits)];
    if (uniqueSuits.length !== 1) return false;
    
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
        
        if (allowJokers && gap > 0 && gap <= (jokers.length - jokerUsed)) {
            jokerUsed += gap;
            expectedIdx = currIdx + 1;
            continue;
        }
        
        return false;
    }
    
    return true;
}

function validateHand(cards, wildJokerRank) {
    const result = {
        isValid: false,
        sequences: [],
        sets: [],
        pureSequence: false,
        totalValue: 0,
        error: null
    };
    
    if (!cards || cards.length !== 13) {
        result.error = `Need 13 cards, have ${cards?.length || 0}`;
        return result;
    }
    
    // Calculate total value
    result.totalValue = cards.reduce((sum, card) => {
        if (card.isWildJoker) return sum;
        return sum + (card.value || 0);
    }, 0);
    
    // Try to find valid combinations
    const remaining = [...cards];
    const sequences = [];
    const sets = [];
    
    // Find sequences first
    for (let i = 0; i < remaining.length - 2; i++) {
        for (let len = 3; len <= remaining.length - i; len++) {
            const subset = remaining.slice(i, i + len);
            if (evaluateSequence(subset, wildJokerRank, false)) {
                sequences.push({ cards: subset, isPure: true });
                result.pureSequence = true;
                break;
            } else if (evaluateSequence(subset, wildJokerRank, true)) {
                sequences.push({ cards: subset, isPure: false });
                break;
            }
        }
    }
    
    // Find sets
    for (let i = 0; i < remaining.length - 2; i++) {
        for (let len = 3; len <= remaining.length - i; len++) {
            const subset = remaining.slice(i, i + len);
            if (evaluateSet(subset, wildJokerRank)) {
                const existingSet = sets.find(s => s.cards[0].rank === subset[0].rank);
                if (!existingSet) {
                    sets.push({ cards: subset });
                }
                break;
            }
        }
    }
    
    result.sequences = sequences;
    result.sets = sets;
    
    // Check if all cards are used
    const usedCards = new Set();
    sequences.forEach(seq => seq.cards.forEach(c => usedCards.add(c.id)));
    sets.forEach(set => set.cards.forEach(c => usedCards.add(c.id)));
    
    result.isValid = usedCards.size === 13 && result.pureSequence;
    
    if (!result.isValid && !result.error) {
        result.error = result.pureSequence ? 
            'All cards must be in valid sequences or sets' : 
            'Need at least one pure sequence (without jokers)';
    }
    
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
            this.totalRounds = totalRounds;
            this.gameLimitType = 'points';
        }
        
        this.currentRound = 1;
        this.isActive = true;
        this.wildJokerRank = null;

        this.gameState = {
            players: [],
            drawPile: [],
            discardPile: [],
            currentPlayerIndex: 0,
            phase: 'SETUP',
            currentLogs: [],
            gameLimitType: this.gameLimitType,
            totalRounds: this.totalRounds,
            targetScore: this.targetScore,
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
            hand: [],
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

        const deck = shuffleDeck(createDeck());
        let deckIndex = 0;

        // Deal 13 cards to each player
        this.gameState.drawPile = deck.slice(validPlayers.length * 13);
        deckIndex = validPlayers.length * 13;

        this.gameState.gamePlayers = validPlayers.map(p => {
            const hand = [];
            for (let i = 0; i < 13; i++) {
                hand.push(deck[deckIndex++]);
            }
            return {
                ...p,
                hand: hand.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)),
                status: 'PLAYING',
                hasDeclared: false
            };
        });

        // Set wild joker from top of draw pile
        this.wildJokerRank = this.gameState.drawPile[0]?.rank || 'A';
        this.gameState.wildJokerRank = this.wildJokerRank;

        // Initialize discard pile
        this.gameState.discardPile = [deck[deckIndex++]];
        
        this.gameState.currentPlayerIndex = 0;
        this.gameState.currentLogs = [
            `Round ${this.currentRound} Started.`,
            `Wild Joker: ${this.wildJokerRank}`,
            `${validPlayers.length} players in game.`
        ];
        this.gameState.phase = 'DRAW';
        this.gameState.winner = null;
        this.gameState.declaredPlayer = null;
        this.gameState.declaredValid = false;

        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    handleAction(action) {
        if (action.type === 'DRAW_CARD') {
            return this.drawCard(action.playerId, action.source);
        }
        if (action.type === 'DISCARD_CARD') {
            return this.discardCard(action.playerId, action.cardId);
        }
        if (action.type === 'DECLARE_RUMMY') {
            return this.declareRummy(action.playerId);
        }
        if (action.type === 'RESOLVE_DECLARE') {
            return this.resolveDeclare(action.winnerId);
        }
        if (action.type === 'SHOW_CARDS') {
            return this.showCards(action.playerId, action.combinations);
        }
        
        return { success: false, error: "Invalid action" };
    }

    drawCard(playerId, source = 'draw') {
        const activePlayer = this.gameState.gamePlayers[this.gameState.currentPlayerIndex];
        
        if (!activePlayer || activePlayer.id !== playerId) {
            return { success: false, error: "Not your turn" };
        }

        if (this.gameState.phase !== 'DRAW') {
            return { success: false, error: "Not in draw phase" };
        }

        let card;
        if (source === 'discard') {
            if (this.gameState.discardPile.length === 0) {
                return { success: false, error: "Discard pile is empty" };
            }
            card = this.gameState.discardPile.pop();
            this.gameState.currentLogs.push(`${activePlayer.name} picked up ${card.rank}${card.suit} from discard`);
        } else {
            if (this.gameState.drawPile.length === 0) {
                return { success: false, error: "Draw pile is empty" };
            }
            card = this.gameState.drawPile.pop();
            this.gameState.currentLogs.push(`${activePlayer.name} drew a card`);
        }

        activePlayer.hand.push(card);
        activePlayer.hand.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));

        // Move to discard phase
        this.gameState.phase = 'DISCARD';
        
        this.emit('state_change', this.getPublicState());
        
        // Send player their updated hand
        this.emit('hand_update', { playerId: activePlayer.id, hand: activePlayer.hand });
        
        return { success: true, card };
    }

    discardCard(playerId, cardId) {
        const activePlayer = this.gameState.gamePlayers[this.gameState.currentPlayerIndex];
        
        if (!activePlayer || activePlayer.id !== playerId) {
            return { success: false, error: "Not your turn" };
        }

        if (this.gameState.phase !== 'DISCARD') {
            return { success: false, error: "Not in discard phase" };
        }

        const cardIndex = activePlayer.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, error: "Card not in hand" };
        }

        const [card] = activePlayer.hand.splice(cardIndex, 1);
        this.gameState.discardPile.push(card);
        
        this.gameState.currentLogs.push(`${activePlayer.name} discarded ${card.rank}${card.suit}`);

        // Check for winner
        const validation = validateHand(activePlayer.hand, this.wildJokerRank);
        
        // Move to next player
        this.nextPlayer();
        
        this.emit('state_change', this.getPublicState());
        
        return { success: true, validation };
    }

    declareRummy(playerId) {
        const activePlayer = this.gameState.gamePlayers[this.gameState.currentPlayerIndex];
        
        if (!activePlayer || activePlayer.id !== playerId) {
            return { success: false, error: "Not your turn" };
        }

        const validation = validateHand(activePlayer.hand, this.wildJokerRank);
        
        this.gameState.declaredPlayer = activePlayer;
        this.gameState.declaredValid = validation.isValid;
        
        if (validation.isValid) {
            this.gameState.currentLogs.push(`🎉 ${activePlayer.name} declares RUMMY! (Valid: ${validation.totalValue} points)`);
        } else {
            this.gameState.currentLogs.push(`⚠️ ${activePlayer.name} declares RUMMY but invalid: ${validation.error}`);
        }

        this.emit('state_change', this.getPublicState());
        
        return { 
            success: true, 
            isValid: validation.isValid, 
            validation,
            player: activePlayer
        };
    }

    resolveDeclare(winnerId) {
        if (!this.gameState.declaredPlayer) {
            return { success: false, error: "No pending declaration" };
        }

        const winner = this.gameState.gamePlayers.find(p => p.id === winnerId);
        const loser = this.gameState.declaredPlayer;
        
        if (!winner) {
            return { success: false, error: "Winner not found" };
        }

        let netChanges = {};
        
        if (this.gameState.declaredValid) {
            // Declaration is valid - winner gets points from all losers
            this.gameState.winner = winner;
            
            this.gameState.gamePlayers.forEach(p => {
                if (p.id === winner.id) return;
                const validation = validateHand(p.hand, this.wildJokerRank);
                const points = validation.totalValue;
                p.score += points;
                netChanges[p.id] = points;
            });
            
            netChanges[winner.id] = 0;
            this.gameState.currentLogs.push(`✅ ${winner.name} wins! Losers get ${Object.values(netChanges).filter(v => v > 0).join(', ')} points`);
        } else {
            // Declaration is invalid - loser gets penalty
            const validation = validateHand(loser.hand, this.wildJokerRank);
            const penalty = 80; // Standard penalty for invalid declaration
            loser.score += penalty;
            netChanges[loser.id] = penalty;
            
            this.gameState.winner = this.gameState.gamePlayers.find(p => p.id !== loser.id);
            this.gameState.currentLogs.push(`❌ ${loser.name}'s declaration invalid! Penalty: ${penalty} points`);
        }

        // Check for eliminations
        const eliminated = [];
        this.gameState.gamePlayers.forEach(p => {
            if (p.score >= this.targetScore) {
                p.status = 'ELIMINATED';
                eliminated.push(p.name);
            }
        });

        if (eliminated.length > 0) {
            this.gameState.currentLogs.push(`🚫 Eliminated: ${eliminated.join(', ')}`);
        }

        // Check if only one player remains
        const remaining = this.gameState.gamePlayers.filter(p => p.status === 'PLAYING');
        
        this.currentRound++;
        
        const isSessionOver = remaining.length <= 1 || this.currentRound > this.totalRounds;

        this.emit('state_change', this.getPublicState());
        
        this.emit('hand_complete', {
            winner: this.gameState.winner,
            pot: 0,
            netChanges,
            currentRound: this.currentRound,
            isSessionOver,
            eliminated,
            remainingPlayers: remaining.length
        });

        if (isSessionOver) {
            this.isActive = false;
            const finalWinner = remaining.length === 1 ? remaining[0] : this.getFinalWinner();
            this.emit('session_ended', {
                reason: 'GAME_COMPLETE',
                finalWinner,
                finalRound: this.currentRound - 1,
                totalRounds: this.totalRounds
            });
        }

        return { success: true, netChanges, eliminated };
    }

    showCards(playerId, combinations) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Player not found" };
        }

        const validation = validateHand(player.hand, this.wildJokerRank);
        
        this.emit('state_change', this.getPublicState());
        
        return { success: true, validation };
    }

    nextPlayer() {
        // Find next active player
        let attempts = 0;
        let nextIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.gamePlayers.length;
        
        while (this.gameState.gamePlayers[nextIndex].status !== 'PLAYING' && attempts < this.gameState.gamePlayers.length) {
            nextIndex = (nextIndex + 1) % this.gameState.gamePlayers.length;
            attempts++;
        }
        
        this.gameState.currentPlayerIndex = nextIndex;
        this.gameState.phase = 'DRAW';
    }

    getFinalWinner() {
        const activePlayers = this.gameState.gamePlayers.filter(p => p.status === 'PLAYING');
        if (activePlayers.length === 1) return activePlayers[0];
        
        // Player with lowest score wins
        return this.gameState.gamePlayers.reduce((min, p) => 
            p.score < min.score ? p : min
        , this.gameState.gamePlayers[0]);
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
            discardPile: this.gameState.discardPile.slice(-1),
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
            declaredValid: this.gameState.declaredValid
        };
    }

    getPlayerHand(playerId) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        if (!player) return null;
        
        return {
            hand: player.hand,
            wildJokerRank: this.wildJokerRank,
            validation: validateHand(player.hand, this.wildJokerRank)
        };
    }
}

module.exports = RummyGameManager;

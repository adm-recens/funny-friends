/**
 * RUMMY GAME MANAGER - LEDGER SYSTEM
 * 
 * ⚠️ IMPORTANT: This is NOT an online game engine!
 * 
 * This class manages the digital ledger for recording physical Rummy games.
 * Players play with REAL cards in person, and the operator uses this app
 * to record scores, track rounds, and calculate settlements.
 * 
 * Key Concepts:
 * - Physical cards are dealt and played in person
 * - This app only RECORDS what happened in the physical game
 * - The operator inputs: who won, what combinations were formed, points, etc.
 * - This class validates that recorded hands are valid Rummy combinations
 * - It calculates scores and maintains the ledger of who owes whom
 * 
 * Game Flow:
 * 1. Operator creates a session and adds players
 * 2. Physical game: Cards are dealt (this app can suggest random hands for recording)
 * 3. Physical game: Players play Rummy with real cards
 * 4. Operator records: who declared, what combinations they had, deadwood points
 * 5. This class validates the declaration and calculates scores
 * 6. All players see updated scores on their devices
 * 7. Process repeats for each round
 * 8. Final settlement shows who pays whom
 * 
 * This is a RECORD-KEEPING system, not a GAME-PLAYING system!
 */

const EventEmitter = require('events');

// Card utilities
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 10
};

function createDeck(withJokers = true) {
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
    
    // Add jokers if requested
    if (withJokers) {
        // Add 2 printed jokers
        deck.push({ suit: '🃏', rank: 'JOKER', value: 0, isJoker: true, id: 'JOKER1' });
        deck.push({ suit: '🃏', rank: 'JOKER', value: 0, isJoker: true, id: 'JOKER2' });
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

// Select a random card to be the wild joker
function selectWildJoker(deck) {
    const nonJokers = deck.filter(c => !c.isJoker);
    const randomCard = nonJokers[Math.floor(Math.random() * nonJokers.length)];
    return { ...randomCard, isWildJoker: true };
}

// Check if a card is a joker (printed or wild)
function isJoker(card, wildJoker) {
    if (card.isJoker) return true;
    if (wildJoker && card.rank === wildJoker.rank) return true;
    return false;
}

// Check if cards form a pure sequence (same suit, consecutive, no jokers)
function isPureSequence(cards) {
    if (cards.length < 3) return false;
    
    // All cards must be non-jokers
    if (cards.some(c => c.isJoker)) return false;
    
    // All cards must have same suit
    const suit = cards[0].suit;
    if (cards.some(c => c.suit !== suit)) return false;
    
    // Check if consecutive
    const sorted = [...cards].sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
    
    for (let i = 1; i < sorted.length; i++) {
        const prevIndex = RANKS.indexOf(sorted[i - 1].rank);
        const currIndex = RANKS.indexOf(sorted[i].rank);
        if (currIndex - prevIndex !== 1) {
            // Special case: A-2-3 is also valid
            if (!(sorted[i - 1].rank === 'A' && sorted[i].rank === '2')) {
                return false;
            }
        }
    }
    
    return true;
}

// Check if cards form an impure sequence (same suit, consecutive, with jokers allowed)
function isImpureSequence(cards, wildJoker) {
    if (cards.length < 3) return false;
    
    const suit = cards[0].suit;
    const nonJokers = cards.filter(c => !isJoker(c, wildJoker));
    const jokers = cards.filter(c => isJoker(c, wildJoker));
    
    // All non-jokers must have same suit
    if (nonJokers.some(c => c.suit !== suit)) return false;
    
    if (nonJokers.length === 0) return true; // All jokers is valid
    
    // Sort non-jokers by rank
    const sorted = [...nonJokers].sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
    
    // Calculate gaps that need to be filled by jokers
    let gaps = 0;
    for (let i = 1; i < sorted.length; i++) {
        const prevIndex = RANKS.indexOf(sorted[i - 1].rank);
        const currIndex = RANKS.indexOf(sorted[i].rank);
        const diff = currIndex - prevIndex - 1;
        if (diff > 0) {
            gaps += diff;
        } else if (diff < 0) {
            // Not consecutive and not A-2-3 case
            if (!(sorted[i - 1].rank === 'A' && sorted[i].rank === '2')) {
                return false;
            }
        }
    }
    
    return jokers.length >= gaps;
}

// Check if cards form a set (same rank, different suits)
function isSet(cards, wildJoker) {
    if (cards.length < 3 || cards.length > 4) return false;
    
    const nonJokers = cards.filter(c => !isJoker(c, wildJoker));
    const jokers = cards.filter(c => isJoker(c, wildJoker));
    
    if (nonJokers.length === 0) return true; // All jokers is valid
    
    // All non-jokers must have same rank
    const rank = nonJokers[0].rank;
    if (nonJokers.some(c => c.rank !== rank)) return false;
    
    // All cards must have different suits
    const suits = new Set(cards.map(c => c.suit));
    return suits.size === cards.length;
}

// Calculate deadwood points for a hand
function calculateDeadwood(hand, wildJoker) {
    // Try to form best combinations
    const combinations = findBestCombinations(hand, wildJoker);
    const usedCards = new Set();
    
    combinations.forEach(combo => {
        combo.cards.forEach(c => usedCards.add(c.id));
    });
    
    // Calculate points for unused cards
    let points = 0;
    hand.forEach(card => {
        if (!usedCards.has(card.id)) {
            points += card.value;
        }
    });
    
    return points;
}

// Find best valid combinations in a hand
function findBestCombinations(hand, wildJoker) {
    const combinations = [];
    const available = [...hand];
    
    // First, find pure sequences (highest priority)
    for (let len = 13; len >= 3; len--) {
        for (let i = 0; i <= available.length - len; i++) {
            const subset = available.slice(i, i + len);
            if (isPureSequence(subset)) {
                combinations.push({ type: 'PURE_SEQUENCE', cards: subset });
                subset.forEach(c => {
                    const idx = available.findIndex(ac => ac.id === c.id);
                    if (idx > -1) available.splice(idx, 1);
                });
                break;
            }
        }
    }
    
    // Then find sets
    const rankGroups = {};
    available.forEach(card => {
        const key = isJoker(card, wildJoker) ? 'JOKER' : card.rank;
        if (!rankGroups[key]) rankGroups[key] = [];
        rankGroups[key].push(card);
    });
    
    Object.values(rankGroups).forEach(group => {
        if (group.length >= 3) {
            // Check if it's a valid set
            const testSet = group.slice(0, 4);
            if (isSet(testSet, wildJoker)) {
                combinations.push({ type: 'SET', cards: testSet });
                testSet.forEach(c => {
                    const idx = available.findIndex(ac => ac.id === c.id);
                    if (idx > -1) available.splice(idx, 1);
                });
            }
        }
    });
    
    // Then find impure sequences
    for (let len = available.length; len >= 3; len--) {
        for (let i = 0; i <= available.length - len; i++) {
            const subset = available.slice(i, i + len);
            if (isImpureSequence(subset, wildJoker)) {
                combinations.push({ type: 'SEQUENCE', cards: subset });
                subset.forEach(c => {
                    const idx = available.findIndex(ac => ac.id === c.id);
                    if (idx > -1) available.splice(idx, 1);
                });
                break;
            }
        }
    }
    
    return combinations;
}

// Validate if a declaration is valid (has at least one pure sequence)
function isValidDeclaration(hand, combinations, wildJoker) {
    // Must have at least one pure sequence
    const hasPureSequence = combinations.some(c => c.type === 'PURE_SEQUENCE');
    if (!hasPureSequence) return false;
    
    // All cards must be used in valid combinations
    const usedCards = new Set();
    combinations.forEach(combo => {
        combo.cards.forEach(c => usedCards.add(c.id));
    });
    
    return usedCards.size === hand.length;
}

class GameManager extends EventEmitter {
    constructor(sessionId, sessionName, totalRounds) {
        super();
        this.sessionId = sessionId;
        this.sessionName = sessionName;
        this.totalRounds = totalRounds;
        this.currentRound = 1;
        this.isActive = true;

        this.gameState = {
            players: [], // { id, name, seat, sessionBalance }
            deck: [],
            discardPile: [],
            wildJoker: null,
            gamePlayers: [], // Players with hands
            currentPlayerIndex: 0,
            currentLogs: [],
            phase: 'SETUP', // SETUP, ACTIVE, DECLARE, SHOWDOWN
            declaredPlayer: null, // Player who declared rummy
            declarations: new Map(), // Player declarations
        };
        
        this.roundScores = []; // Track scores for each round
    }

    // --- SETUP ---
    setPlayers(initialPlayers) {
        this.gameState.players = initialPlayers.map(p => ({
            ...p,
            hasDeclared: false,
            isEliminated: false
        }));
        if (!this.gameState.phase || this.gameState.phase === 'SETUP') {
            this.gameState.phase = 'SETUP';
        }
    }

    addPlayer(player) {
        if (this.gameState.phase !== 'SETUP') return false;
        this.gameState.players.push({
            ...player,
            hasDeclared: false,
            isEliminated: false
        });
        return true;
    }

    removePlayer(playerId) {
        if (this.gameState.phase !== 'SETUP') return false;
        this.gameState.players = this.gameState.players.filter(p => p.id !== playerId);
        return true;
    }

    // --- GAME LOOP ---
    startRound() {
        console.log('[RUMMY] startRound called. Total players:', this.gameState.players.length);
        
        if (this.currentRound > this.totalRounds) {
            this.isActive = false;
            return { success: false, error: "Session complete" };
        }
        
        const validPlayers = this.gameState.players.filter(p => p.name && p.name.trim() !== '');
        console.log('[RUMMY] Valid players:', validPlayers.length);
        
        if (validPlayers.length < 2) return { success: false, error: "Not enough players" };

        // Create and shuffle deck
        const deck = shuffleDeck(createDeck(true));
        
        // Select wild joker
        const wildJoker = selectWildJoker(deck);
        this.gameState.wildJoker = wildJoker;
        
        // Remove wild joker from deck (it's displayed separately)
        const wildIndex = deck.findIndex(c => c.id === wildJoker.id);
        if (wildIndex > -1) deck.splice(wildIndex, 1);
        
        // Deal 13 cards to each player
        let deckIndex = 0;
        this.gameState.gamePlayers = validPlayers.map(p => ({
            ...p,
            hand: deck.slice(deckIndex, deckIndex + 13),
            hasDrawn: false,
            hasDeclared: false,
            declaredCombinations: [],
            deadwood: 0
        }));
        deckIndex += validPlayers.length * 13;
        
        // Set up draw pile and discard pile
        this.gameState.deck = deck.slice(deckIndex, deck.length - 1);
        this.gameState.discardPile = [deck[deck.length - 1]]; // Top card as first discard
        
        this.gameState.currentPlayerIndex = 0;
        this.gameState.phase = 'ACTIVE';
        this.gameState.declaredPlayer = null;
        this.gameState.declarations.clear();
        this.gameState.currentLogs = [`Round ${this.currentRound} started. Wild Joker: ${wildJoker.rank}`];
        
        console.log('[RUMMY] Round started. Cards dealt:', this.gameState.gamePlayers[0]?.hand.length);
        
        this.emit('state_change', this.getPublicState());
        return { success: true };
    }

    // --- PLAYER ACTIONS ---
    drawCard(playerId, source) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        if (!player) return { success: false, error: "Player not found" };
        
        const currentPlayer = this.gameState.gamePlayers[this.gameState.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
            return { success: false, error: "Not your turn" };
        }
        
        if (player.hasDrawn) {
            return { success: false, error: "Already drawn" };
        }
        
        let card;
        if (source === 'deck') {
            if (this.gameState.deck.length === 0) {
                // Reshuffle discard pile (except top card)
                const topCard = this.gameState.discardPile.pop();
                this.gameState.deck = shuffleDeck(this.gameState.discardPile);
                this.gameState.discardPile = [topCard];
            }
            card = this.gameState.deck.pop();
        } else if (source === 'discard') {
            if (this.gameState.discardPile.length === 0) {
                return { success: false, error: "Discard pile empty" };
            }
            card = this.gameState.discardPile.pop();
        } else {
            return { success: false, error: "Invalid source" };
        }
        
        player.hand.push(card);
        player.hasDrawn = true;
        
        this.gameState.currentLogs.push(`${player.name} drew from ${source}`);
        this.emit('state_change', this.getPublicState());
        
        return { success: true, card };
    }

    discardCard(playerId, cardId) {
        const playerIndex = this.gameState.gamePlayers.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return { success: false, error: "Player not found" };
        
        if (playerIndex !== this.gameState.currentPlayerIndex) {
            return { success: false, error: "Not your turn" };
        }
        
        const player = this.gameState.gamePlayers[playerIndex];
        if (!player.hasDrawn) {
            return { success: false, error: "Must draw first" };
        }
        
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, error: "Card not in hand" };
        
        const card = player.hand.splice(cardIndex, 1)[0];
        this.gameState.discardPile.push(card);
        player.hasDrawn = false;
        
        // Check if player has declared
        if (player.hasDeclared) {
            // Move to next player who hasn't declared
            this.moveToNextUndeclaredPlayer();
        } else {
            // Normal turn progression
            this.gameState.currentPlayerIndex = this.getNextActiveIndex(this.gameState.currentPlayerIndex);
        }
        
        this.gameState.currentLogs.push(`${player.name} discarded ${card.rank}${card.suit}`);
        this.emit('state_change', this.getPublicState());
        
        return { success: true };
    }

    declareRummy(playerId, combinations) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        if (!player) return { success: false, error: "Player not found" };
        
        if (this.gameState.phase !== 'ACTIVE') {
            return { success: false, error: "Cannot declare now" };
        }
        
        // Validate declaration
        if (!isValidDeclaration(player.hand, combinations, this.gameState.wildJoker)) {
            return { success: false, error: "Invalid declaration - must have at least one pure sequence" };
        }
        
        player.hasDeclared = true;
        player.declaredCombinations = combinations;
        player.deadwood = 0;
        
        this.gameState.declaredPlayer = player;
        this.gameState.phase = 'DECLARE';
        this.gameState.declarations.set(playerId, { combinations, deadwood: 0 });
        
        this.gameState.currentLogs.push(`${player.name} declared Rummy!`);
        this.emit('state_change', this.getPublicState());
        
        // Give other players one more turn to reduce deadwood
        this.moveToNextUndeclaredPlayer();
        
        return { success: true };
    }

    showCards(playerId, combinations) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        if (!player) return { success: false, error: "Player not found" };
        
        if (this.gameState.phase !== 'DECLARE') {
            return { success: false, error: "Cannot show cards now" };
        }
        
        // Calculate deadwood
        const usedCards = new Set();
        combinations.forEach(combo => {
            combo.cards.forEach(c => usedCards.add(c.id));
        });
        
        let deadwood = 0;
        player.hand.forEach(card => {
            if (!usedCards.has(card.id)) {
                deadwood += card.value;
            }
        });
        
        player.declaredCombinations = combinations;
        player.deadwood = deadwood;
        this.gameState.declarations.set(playerId, { combinations, deadwood });
        
        this.gameState.currentLogs.push(`${player.name} showed cards (${deadwood} points)`);
        
        // Check if all players have shown
        const allShown = this.gameState.gamePlayers.every(p => 
            p.hasDeclared || this.gameState.declarations.has(p.id)
        );
        
        if (allShown) {
            this.endHand();
        } else {
            this.moveToNextUndeclaredPlayer();
            this.emit('state_change', this.getPublicState());
        }
        
        return { success: true, deadwood };
    }

    // --- HELPERS ---
    moveToNextUndeclaredPlayer() {
        let nextIndex = this.gameState.currentPlayerIndex;
        let attempts = 0;
        
        do {
            nextIndex = this.getNextActiveIndex(nextIndex);
            const player = this.gameState.gamePlayers[nextIndex];
            if (!player.hasDeclared && !this.gameState.declarations.has(player.id)) {
                this.gameState.currentPlayerIndex = nextIndex;
                return;
            }
            attempts++;
        } while (attempts < this.gameState.gamePlayers.length);
        
        // All players have declared/shown
        this.endHand();
    }

    getNextActiveIndex(currentIndex) {
        const len = this.gameState.gamePlayers.length;
        return (currentIndex + 1) % len;
    }

    endHand() {
        this.gameState.phase = 'SHOWDOWN';
        
        // Calculate final scores
        const declarer = this.gameState.declaredPlayer;
        const declarerDeadwood = declarer ? declarer.deadwood : 0;
        
        const netChanges = {};
        const handResults = [];
        
        this.gameState.gamePlayers.forEach(player => {
            const declaration = this.gameState.declarations.get(player.id);
            const deadwood = declaration ? declaration.deadwood : player.deadwood;
            
            let points = deadwood;
            
            // If declarer has 0 deadwood, they win full points from others
            if (declarer && declarer.id === player.id) {
                if (declarerDeadwood === 0) {
                    points = 0; // Perfect win
                }
            } else {
                // Other players lose their deadwood points
                if (declarerDeadwood === 0) {
                    // Declarer wins difference
                    points = deadwood;
                }
            }
            
            netChanges[player.id] = -points;
            player.sessionBalance -= points;
            
            handResults.push({
                playerId: player.id,
                name: player.name,
                deadwood: points,
                isDeclarer: declarer && declarer.id === player.id,
                combinations: player.declaredCombinations || []
            });
        });
        
        // Winner is declarer if they have lowest deadwood
        const winner = declarer || this.gameState.gamePlayers.reduce((min, p) => 
            p.deadwood < min.deadwood ? p : min
        );
        
        // Winner gets the sum of all deadwood points
        const totalDeadwood = Object.values(netChanges).reduce((a, b) => a + b, 0) * -1;
        netChanges[winner.id] = totalDeadwood;
        winner.sessionBalance += totalDeadwood * 2; // Add back what they lost plus winnings
        
        this.roundScores.push({
            round: this.currentRound,
            winner: winner.name,
            winnerId: winner.id,
            scores: handResults
        });
        
        this.gameState.currentLogs.push(`Hand Over. Winner: ${winner.name}`);
        
        this.currentRound++;
        const isSessionOver = this.currentRound > this.totalRounds;
        
        this.emit('state_change', this.getPublicState());
        
        this.emit('hand_complete', {
            winner: { id: winner.id, name: winner.name },
            netChanges,
            handResults,
            currentRound: this.currentRound,
            isSessionOver,
            wildJoker: this.gameState.wildJoker
        });
        
        if (isSessionOver) {
            this.endSession();
        }
    }

    endSession() {
        this.isActive = false;
        this.gameState.phase = 'COMPLETED';
        
        // Calculate final standings
        const standings = this.gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            finalBalance: p.sessionBalance,
            totalPoints: this.roundScores.reduce((sum, round) => {
                const score = round.scores.find(s => s.playerId === p.id);
                return sum + (score ? score.deadwood : 0);
            }, 0)
        })).sort((a, b) => a.totalPoints - b.totalPoints);
        
        this.emit('session_ended', {
            standings,
            roundScores: this.roundScores
        });
    }

    getPublicState() {
        return {
            sessionId: this.sessionId,
            sessionName: this.sessionName,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            phase: this.gameState.phase,
            wildJoker: this.gameState.wildJoker,
            players: this.gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                seat: p.seat,
                sessionBalance: p.sessionBalance,
                hasDeclared: p.hasDeclared
            })),
            gamePlayers: this.gameState.gamePlayers.map(p => ({
                id: p.id,
                name: p.name,
                seat: p.seat,
                sessionBalance: p.sessionBalance,
                cardCount: p.hand.length,
                hasDrawn: p.hasDrawn,
                hasDeclared: p.hasDeclared,
                deadwood: p.deadwood,
                // Only show hand to the player themselves
                hand: undefined,
                declaredCombinations: p.declaredCombinations
            })),
            currentPlayerIndex: this.gameState.currentPlayerIndex,
            discardPileTop: this.gameState.discardPile.length > 0 
                ? this.gameState.discardPile[this.gameState.discardPile.length - 1] 
                : null,
            deckCount: this.gameState.deck.length,
            currentLogs: this.gameState.currentLogs,
            declaredPlayer: this.gameState.declaredPlayer ? {
                id: this.gameState.declaredPlayer.id,
                name: this.gameState.declaredPlayer.name
            } : null,
            isActive: this.isActive
        };
    }

    getPlayerHand(playerId) {
        const player = this.gameState.gamePlayers.find(p => p.id === playerId);
        if (!player) return null;
        return {
            hand: player.hand,
            wildJoker: this.gameState.wildJoker,
            canDeclare: this.gameState.phase === 'ACTIVE' && !player.hasDeclared
        };
    }
}

module.exports = GameManager;

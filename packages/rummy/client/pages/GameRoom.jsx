import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Play, LogOut, Eye, EyeOff, Check, X, 
    Trophy, UserPlus, Send, AlertCircle, Layers, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../../platform/client/src/context/AuthContext';
import { useToast } from '../../../platform/client/src/context/ToastContext';
import { API_URL } from '../../../platform/client/src/config';

const RummyGameRoom = () => {
    const { sessionName } = useParams();
    const navigate = useNavigate();
    const { user, socket } = useAuth();
    const toast = useToast();

    // Game State
    const [gameState, setGameState] = useState({
        phase: 'SETUP',
        players: [],
        gamePlayers: [],
        currentRound: 1,
        totalRounds: 10,
        currentPlayerIndex: 0,
        wildJoker: null,
        discardPileTop: null,
        deckCount: 0,
        currentLogs: [],
        declaredPlayer: null
    });

    // Player State
    const [myHand, setMyHand] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [combinations, setCombinations] = useState([]);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [showDeclareModal, setShowDeclareModal] = useState(false);
    const [roundSummary, setRoundSummary] = useState(null);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [viewerRequests, setViewerRequests] = useState([]);

    // UI State
    const [showCardBacks, setShowCardBacks] = useState(true);
    const [connectionError, setConnectionError] = useState(null);

    // Join session on mount
    useEffect(() => {
        if (!socket.connected) socket.connect();

        const isOperatorOrAdmin = user?.role === 'OPERATOR' || user?.role === 'ADMIN';
        socket.emit('join_session', { 
            sessionName, 
            role: isOperatorOrAdmin ? 'OPERATOR' : 'PLAYER',
            gameType: 'rummy'
        });

        socket.on('connect_error', (err) => {
            setConnectionError("Connection lost. Reconnecting...");
        });

        socket.on('game_update', (state) => {
            setConnectionError(null);
            if (!state) return;

            if (state.type === 'HAND_COMPLETE') {
                setRoundSummary({
                    winner: state.winner,
                    handResults: state.handResults,
                    currentRound: state.currentRound,
                    isSessionOver: state.isSessionOver,
                    wildJoker: state.wildJoker
                });
            } else if (state.type === 'SESSION_ENDED') {
                setSessionSummary(state.standings);
            } else {
                setGameState(state);
            }
        });

        socket.on('player_hand', (data) => {
            if (data.hand) {
                setMyHand(data.hand);
            }
        });

        return () => {
            socket.off('game_update');
            socket.off('player_hand');
            socket.off('connect_error');
        };
    }, [socket, sessionName, user]);

    // Game Actions
    const drawFromDeck = () => {
        socket.emit('game_action', {
            type: 'DRAW_CARD',
            sessionName,
            source: 'deck'
        });
    };

    const drawFromDiscard = () => {
        socket.emit('game_action', {
            type: 'DRAW_CARD',
            sessionName,
            source: 'discard'
        });
    };

    const discardCard = (cardId) => {
        socket.emit('game_action', {
            type: 'DISCARD_CARD',
            sessionName,
            cardId
        });
        setSelectedCards([]);
    };

    const declareRummy = () => {
        if (combinations.length === 0) {
            toast.error('Please arrange your cards into valid combinations first');
            return;
        }
        
        socket.emit('game_action', {
            type: 'DECLARE_RUMMY',
            sessionName,
            combinations
        });
        setShowDeclareModal(false);
    };

    const showCards = () => {
        socket.emit('game_action', {
            type: 'SHOW_CARDS',
            sessionName,
            combinations
        });
    };

    const startGame = () => {
        socket.emit('game_action', {
            type: 'START_ROUND',
            sessionName
        });
    };

    // Card selection and combination management
    const toggleCardSelection = (cardId) => {
        if (selectedCards.includes(cardId)) {
            setSelectedCards(selectedCards.filter(id => id !== cardId));
        } else {
            setSelectedCards([...selectedCards, cardId]);
        }
    };

    const createCombination = (type) => {
        if (selectedCards.length < 3) {
            toast.error('Select at least 3 cards');
            return;
        }
        
        const cards = myHand.filter(c => selectedCards.includes(c.id));
        const newCombo = { type, cards };
        
        setCombinations([...combinations, newCombo]);
        
        // Remove cards from hand
        const remainingHand = myHand.filter(c => !selectedCards.includes(c.id));
        setMyHand(remainingHand);
        setSelectedCards([]);
    };

    const removeFromCombination = (comboIndex, cardId) => {
        const combo = combinations[comboIndex];
        const card = combo.cards.find(c => c.id === cardId);
        
        if (card) {
            // Return card to hand
            setMyHand([...myHand, card]);
            
            // Remove from combination
            const updatedCards = combo.cards.filter(c => c.id !== cardId);
            if (updatedCards.length < 3) {
                // Remove entire combination if less than 3 cards
                const newCombos = combinations.filter((_, i) => i !== comboIndex);
                setCombinations(newCombos);
            } else {
                const newCombos = [...combinations];
                newCombos[comboIndex] = { ...combo, cards: updatedCards };
                setCombinations(newCombos);
            }
        }
    };

    // Helpers
    const isMyTurn = () => {
        const currentPlayer = gameState.gamePlayers[gameState.currentPlayerIndex];
        return currentPlayer && currentPlayer.id === user?.id;
    };

    const getCardStyle = (suit) => {
        if (suit === '♥' || suit === '♦') return 'text-red-500';
        if (suit === '♠' || suit === '♣') return 'text-slate-800';
        return 'text-purple-600';
    };

    const getCardBg = (suit) => {
        if (suit === '♥' || suit === '♦') return 'bg-red-50';
        if (suit === '♠' || suit === '♣') return 'bg-slate-50';
        return 'bg-purple-50';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/operator-dashboard')}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-white">Rummy - {sessionName}</h1>
                                <p className="text-sm text-slate-400">
                                    Round {gameState.currentRound} of {gameState.totalRounds}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {gameState.wildJoker && (
                                <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-xl">
                                    <span className="text-purple-400 text-sm">Wild Joker:</span>
                                    <span className="text-white font-bold">
                                        {gameState.wildJoker.rank}
                                    </span>
                                </div>
                            )}
                            
                            {gameState.phase === 'SETUP' && (
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    <Play size={18} />
                                    Start Game
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Game Area */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {connectionError && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-center">
                        {connectionError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Players & Table */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Game Table */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">Game Table</h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    gameState.phase === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                    gameState.phase === 'DECLARE' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-slate-500/20 text-slate-400'
                                }`}>
                                    {gameState.phase}
                                </span>
                            </div>

                            {/* Draw & Discard Piles */}
                            <div className="flex items-center justify-center gap-8 mb-6">
                                {/* Draw Pile */}
                                <div className="text-center">
                                    <button
                                        onClick={drawFromDeck}
                                        disabled={!isMyTurn() || hasDrawn || gameState.phase !== 'ACTIVE'}
                                        className="w-24 h-32 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all"
                                    >
                                        <div className="h-full flex flex-col items-center justify-center">
                                            <Layers size={24} className="text-white/80 mb-2" />
                                            <span className="text-white font-bold">{gameState.deckCount}</span>
                                        </div>
                                    </button>
                                    <p className="text-slate-400 text-sm mt-2">Draw Pile</p>
                                </div>

                                {/* Discard Pile */}
                                <div className="text-center">
                                    <button
                                        onClick={drawFromDiscard}
                                        disabled={!isMyTurn() || hasDrawn || !gameState.discardPileTop || gameState.phase !== 'ACTIVE'}
                                        className="w-24 h-32 bg-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all border-2 border-slate-300"
                                    >
                                        {gameState.discardPileTop ? (
                                            <div className="h-full flex flex-col items-center justify-center">
                                                <span className={`text-3xl ${getCardStyle(gameState.discardPileTop.suit)}`}>
                                                    {gameState.discardPileTop.suit}
                                                </span>
                                                <span className="text-slate-800 font-bold text-lg">
                                                    {gameState.discardPileTop.rank}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-400">
                                                Empty
                                            </div>
                                        )}
                                    </button>
                                    <p className="text-slate-400 text-sm mt-2">Discard</p>
                                </div>
                            </div>

                            {/* Players */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {gameState.gamePlayers.map((player, index) => (
                                    <div 
                                        key={player.id}
                                        className={`p-4 rounded-xl border ${
                                            index === gameState.currentPlayerIndex 
                                                ? 'border-yellow-500 bg-yellow-500/10' 
                                                : 'border-white/10 bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium">{player.name}</span>
                                            {player.hasDeclared && (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                    Declared
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400">{player.cardCount} cards</span>
                                            <span className="text-yellow-400 font-mono">
                                                ₹{player.sessionBalance}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Game Logs */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-48 overflow-y-auto">
                            <h3 className="text-white font-bold mb-3">Game Log</h3>
                            <div className="space-y-2">
                                {gameState.currentLogs.map((log, i) => (
                                    <p key={i} className="text-slate-400 text-sm">
                                        {log}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - My Hand */}
                    <div className="space-y-6">
                        {/* My Hand */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white">My Hand</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCardBacks(!showCardBacks)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
                                    >
                                        {showCardBacks ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {myHand.map((card) => (
                                    <button
                                        key={card.id}
                                        onClick={() => toggleCardSelection(card.id)}
                                        disabled={!hasDrawn && gameState.phase === 'ACTIVE'}
                                        className={`aspect-[3/4] rounded-lg border-2 transition-all ${
                                            selectedCards.includes(card.id)
                                                ? 'border-yellow-500 bg-yellow-500/20'
                                                : 'border-slate-600 hover:border-slate-400'
                                        } ${getCardBg(card.suit)} disabled:opacity-50`}
                                    >
                                        <div className="h-full flex flex-col items-center justify-center">
                                            <span className={`text-lg ${getCardStyle(card.suit)}`}>
                                                {card.suit}
                                            </span>
                                            <span className="text-slate-800 font-bold">
                                                {card.rank}
                                            </span>
                                            {card.isJoker && (
                                                <span className="text-xs text-purple-600 font-bold">JOKER</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Actions */}
                            {isMyTurn() && gameState.phase === 'ACTIVE' && (
                                <div className="space-y-3">
                                    {!hasDrawn ? (
                                        <p className="text-center text-slate-400 text-sm">
                                            Draw a card from deck or discard pile
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-center text-slate-400 text-sm">
                                                Select a card to discard or declare
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setShowDeclareModal(true)}
                                                    className="py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                                                >
                                                    Declare
                                                </button>
                                                <button
                                                    onClick={() => selectedCards.length === 1 && discardCard(selectedCards[0])}
                                                    disabled={selectedCards.length !== 1}
                                                    className="py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                                                >
                                                    Discard
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {gameState.phase === 'DECLARE' && !gameState.declaredPlayer?.id === user?.id && (
                                <button
                                    onClick={showCards}
                                    className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    Show Cards
                                </button>
                            )}
                        </div>

                        {/* Combinations */}
                        {combinations.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-white font-bold mb-3">My Combinations</h3>
                                <div className="space-y-3">
                                    {combinations.map((combo, idx) => (
                                        <div key={idx} className="p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-slate-400 text-sm capitalize">
                                                    {combo.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {combo.cards.map(card => (
                                                    <div 
                                                        key={card.id}
                                                        className={`w-12 h-16 ${getCardBg(card.suit)} rounded-lg flex flex-col items-center justify-center`}
                                                    >
                                                        <span className={`text-sm ${getCardStyle(card.suit)}`}>
                                                            {card.suit}
                                                        </span>
                                                        <span className="text-slate-800 font-bold text-sm">
                                                            {card.rank}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Declare Modal */}
            {showDeclareModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold text-white mb-4">Declare Rummy</h2>
                        <p className="text-slate-400 mb-4">
                            Arrange your cards into valid combinations. You need at least one pure sequence.
                        </p>
                        
                        {/* Combination Builder */}
                        <div className="space-y-4 mb-6">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => createCombination('PURE_SEQUENCE')}
                                    disabled={selectedCards.length < 3}
                                    className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 text-green-400 font-bold rounded-xl transition-colors"
                                >
                                    Pure Sequence
                                </button>
                                <button
                                    onClick={() => createCombination('SEQUENCE')}
                                    disabled={selectedCards.length < 3}
                                    className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 text-blue-400 font-bold rounded-xl transition-colors"
                                >
                                    Sequence
                                </button>
                                <button
                                    onClick={() => createCombination('SET')}
                                    disabled={selectedCards.length < 3}
                                    className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 text-purple-400 font-bold rounded-xl transition-colors"
                                >
                                    Set
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeclareModal(false)}
                                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={declareRummy}
                                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Confirm Declare
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Round Summary Modal */}
            {roundSummary && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full">
                        <div className="text-center mb-6">
                            <Trophy size={48} className="text-yellow-400 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold text-white">
                                Round {roundSummary.currentRound - 1} Complete
                            </h2>
                            <p className="text-slate-400">
                                Winner: {roundSummary.winner?.name}
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {roundSummary.handResults?.map((result, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <span className="text-white font-medium">{result.name}</span>
                                    <div className="text-right">
                                        <span className={`font-mono font-bold ${
                                            result.isDeclarer ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {result.deadwood} pts
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setRoundSummary(null);
                                if (roundSummary.isSessionOver) {
                                    // Show session summary
                                }
                            }}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
                        >
                            {roundSummary.isSessionOver ? 'View Final Results' : 'Next Round'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RummyGameRoom;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Play, Square, RotateCcw, 
  Clock, AlertCircle, Wifi, WifiOff,
  Trash2, Trophy, X, Check, UserPlus, Star, Plus, Minus
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const GameSession = () => {
  const { sessionName } = useParams();
  const navigate = useNavigate();
  const { user, socket } = useAuth();
  const toast = useToast();
  
  const [session, setSession] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  
  const [roundSummaryData, setRoundSummaryData] = useState(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [viewerRequests, setViewerRequests] = useState([]);
  const [newPlayerNames, setNewPlayerNames] = useState('');
  const [showPlayerRequestModal, setShowPlayerRequestModal] = useState(false);
  
  // Ledger actions
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [pointsInput, setPointsInput] = useState('');

  const isOperatorOrAdmin = user?.role === 'OPERATOR' || user?.role === 'ADMIN';
  const isRummy = session?.gameCode === 'rummy';

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        const sessionsRes = await fetch(`${API_URL}/api/v2/sessions`, {
          credentials: 'include'
        });
        
        if (!sessionsRes.ok) {
          throw new Error(`Failed to fetch sessions: ${sessionsRes.status}`);
        }
        
        const data = await sessionsRes.json();
        const decodedName = decodeURIComponent(sessionName);
        const sessionData = data.sessions?.find(s => s.name === decodedName);
        
        if (sessionData) {
          setSession(sessionData);
          setSessionStatus(sessionData.status || 'waiting');
          
          const playersRes = await fetch(`${API_URL}/api/sessions/${encodeURIComponent(decodedName)}/players`, {
            credentials: 'include'
          });
          
          if (playersRes.ok) {
            const playersData = await playersRes.json();
            if (playersData.success && playersData.players) {
              setPlayers(playersData.players);
            }
          }
        } else {
          setError('Session not found');
        }
      } catch (e) {
        setError('Failed to load session: ' + e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionName]);

  useEffect(() => {
    if (!socket) return;

    const decodedSessionName = decodeURIComponent(sessionName);

    const joinSession = () => {
      socket.emit('join_session', { 
        sessionName: decodedSessionName, 
        role: 'OPERATOR' 
      });
    };

    const onConnect = () => {
      setIsConnected(true);
      setError('');
      joinSession();
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onGameUpdate = (state) => {
      if (!state) return;
      
      if (state.type === 'HAND_COMPLETE') {
        setRoundSummaryData({
          winner: state.winner,
          pot: state.pot,
          netChanges: state.netChanges,
          currentRound: state.currentRound,
          isSessionOver: state.isSessionOver,
          eliminated: state.eliminated,
          remainingPlayers: state.remainingPlayers
        });
        setShowRoundSummary(true);
        if (state.players) setPlayers(state.players);
      } else if (state.type === 'SESSION_ENDED' || state.reason) {
        setSessionSummaryData(state);
        setShowSessionSummary(true);
      } else {
        setGameState(state);
        if (state.players && state.players.length > 0) {
          setPlayers(state.players);
        }
        if (state.gamePlayers) {
          setGamePlayers(state.gamePlayers);
        }
        if (state.phase) {
          setSessionStatus(state.phase.toLowerCase());
        }
      }
    };

    const onViewerRequested = (req) => {
      if (isOperatorOrAdmin) {
        setViewerRequests(prev => {
          if (prev.find(r => r.socketId === req.socketId)) return prev;
          return [...prev, req];
        });
      }
    };

    const onSessionEnded = (data) => {
      setSessionSummaryData(data);
      setShowSessionSummary(true);
    };

    const onErrorMessage = (message) => {
      toast.error(message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_update', onGameUpdate);
    socket.on('viewer_requested', onViewerRequested);
    socket.on('session_ended', onSessionEnded);
    socket.on('error_message', onErrorMessage);

    if (!socket.connected) {
      socket.connect();
    } else {
      joinSession();
    }

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_update', onGameUpdate);
      socket.off('viewer_requested', onViewerRequested);
      socket.off('session_ended', onSessionEnded);
      socket.off('error_message', onErrorMessage);
      socket.emit('leave_session', { sessionName: decodedSessionName });
    };
  }, [socket, sessionName, isOperatorOrAdmin]);

  const sendGameAction = (type, payload = {}) => {
    socket.emit('game_action', {
      sessionName: decodeURIComponent(sessionName),
      type,
      ...payload
    });
  };

  const handleStartGame = () => {
    sendGameAction('START_GAME');
  };

  const handleEndGame = () => {
    if (confirm('Are you sure you want to end this session?')) {
      sendGameAction('END_SESSION');
    }
  };

  const handleNextRound = () => {
    const isSessionOver = roundSummaryData?.isSessionOver;
    
    setShowRoundSummary(false);
    setRoundSummaryData(null);
    
    if (isSessionOver) {
      navigate('/operator/sessions');
    } else {
      sendGameAction('START_GAME');
    }
  };

  // Ledger actions
  const openPointsModal = (player) => {
    setSelectedPlayer(player);
    setPointsInput('');
    setShowPointsModal(true);
  };

  const handleAddPoints = () => {
    const points = parseInt(pointsInput);
    if (isNaN(points) || points <= 0) {
      toast.error('Please enter valid points');
      return;
    }
    sendGameAction('RECORD_POINTS', { playerId: selectedPlayer.id, points });
    setShowPointsModal(false);
    setSelectedPlayer(null);
    setPointsInput('');
  };

  const openWinnerModal = () => {
    setShowWinnerModal(true);
  };

  const handleRecordWinner = (winnerId) => {
    sendGameAction('RECORD_WINNER', { winnerId });
    setShowWinnerModal(false);
  };

  const handleEliminate = (playerId) => {
    if (confirm('Are you sure you want to eliminate this player?')) {
      sendGameAction('ELIMINATE_PLAYER', { playerId });
    }
  };

  // Viewer actions
  const resolveViewerRequest = (socketId, approved) => {
    socket.emit('resolve_access', { 
      sessionName: decodeURIComponent(sessionName), 
      viewerId: socketId, 
      approved 
    });
    setViewerRequests(prev => prev.filter(r => r.socketId !== socketId));
  };

  const handleRequestNewPlayers = async () => {
    const playerNames = newPlayerNames
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (playerNames.length === 0) {
      toast.error('Please enter at least one player name');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/sessions/${decodeURIComponent(sessionName)}/player-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerNames }),
        credentials: 'include'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Requested to add ${playerNames.length} player(s)`);
        setNewPlayerNames('');
        setShowPlayerRequestModal(false);
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (e) {
      toast.error('Error submitting request');
    }
  };

  const getPhaseBadgeColor = (phase) => {
    switch (phase?.toUpperCase()) {
      case 'ACTIVE':
      case 'PLAYING':
        return 'bg-green-500/20 text-green-400';
      case 'SETUP':
      case 'WAITING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED':
      case 'ENDED':
        return 'bg-slate-500/20 text-slate-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading session...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      </div>
    );
  }

  const currentPhase = gameState?.phase || sessionStatus?.toUpperCase() || 'SETUP';
  const activePlayers = gameState?.players?.filter(p => p.status !== 'ELIMINATED') || players.filter(p => p.status !== 'ELIMINATED');

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <div className={`absolute inset-0 ${isRummy ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900 via-slate-900 to-black' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900 via-slate-900 to-black'} opacity-60`}></div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/operator/sessions')}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-50">
                  {decodeURIComponent(sessionName)}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm">
                  {session?.gameName || session?.gameCode} • Round {gameState?.currentRound || 1}/{gameState?.totalRounds || session?.totalRounds || 10}
                  {isRummy && gameState?.targetScore && ` • Target: ${gameState.targetScore} pts`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRummy && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Star size={16} />
                  <span>Target: {gameState?.targetScore || 100}</span>
                </div>
              )}
              {isConnected ? (
                <Wifi size={16} className="text-green-500" />
              ) : (
                <WifiOff size={16} className="text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* SETUP PHASE */}
        {currentPhase === 'SETUP' && isOperatorOrAdmin && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  <Users size={18} className="text-violet-400" />
                  Players ({players.length})
                </h2>
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                  Round {gameState?.currentRound || 1}/{gameState?.totalRounds || session?.totalRounds || 10}
                </span>
              </div>
              
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-2">No players yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {players.map((player, index) => (
                    <div 
                      key={player.id || index}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {player.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-50">{player.name}</div>
                          <div className="text-xs text-slate-400">Seat {player.seat || index + 1}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {players.length < 2 && (
                <div className="mt-4 text-center text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                  Need at least 2 players to start
                </div>
              )}
            </div>

            {viewerRequests.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
                  Access Requests
                </h2>
                <div className="space-y-2">
                  {viewerRequests.map((req) => (
                    <div key={req.socketId} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                      <span className="font-medium text-slate-50">{req.name}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => resolveViewerRequest(req.socketId, true)}
                          className="p-1 px-3 bg-green-500/20 text-green-400 rounded-md text-sm font-medium hover:bg-green-500/30"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => resolveViewerRequest(req.socketId, false)}
                          className="p-1 px-3 bg-red-500/20 text-red-400 rounded-md text-sm font-medium hover:bg-red-500/30"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:from-green-500 hover:to-green-600 transition-all"
            >
              <Play size={20} />
              Start Round {gameState?.currentRound || 1}
            </button>
          </div>
        )}

        {/* ACTIVE GAME - LEDGER STYLE */}
        {currentPhase !== 'SETUP' && (
          <div className="space-y-6">
            
            {/* Game Logs */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Game Log</h3>
              <div className="h-24 overflow-y-auto text-sm text-slate-300 space-y-1">
                {gameState?.currentLogs?.slice(-5).map((log, i) => (
                  <div key={i} className="text-slate-400">{log}</div>
                )) || gameState?.currentLogs?.map((log, i) => (
                  <div key={i} className="text-slate-400">{log}</div>
                )) || <div className="text-slate-500">No logs yet</div>}
              </div>
            </div>

            {/* Players with Scores */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  <Users size={18} className="text-violet-400" />
                  Players
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={openWinnerModal}
                    disabled={!isOperatorOrAdmin}
                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/30 flex items-center gap-1"
                  >
                    <Trophy size={14} /> Record Winner
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(gameState?.players || players).map((player, index) => {
                  const isEliminated = player.status === 'ELIMINATED';
                  
                  return (
                    <div 
                      key={player.id || index}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isEliminated 
                          ? 'border-red-800 bg-red-900/20 opacity-60' 
                          : 'border-slate-700 bg-slate-700/30'
                      }`}
                    >
                      {isEliminated && (
                        <div className="absolute top-2 right-2 text-xs text-red-400 font-bold">ELIMINATED</div>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {player.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-50">{player.name}</div>
                            <div className="text-xs text-slate-400">Seat {player.seat || index + 1}</div>
                          </div>
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="text-center mb-3">
                        <div className="text-3xl font-bold text-white">
                          {player.score || player.sessionBalance || 0}
                        </div>
                        <div className="text-xs text-slate-400">
                          {isRummy ? 'points' : 'points'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {isOperatorOrAdmin && !isEliminated && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPointsModal(player)}
                            className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 flex items-center justify-center gap-1"
                          >
                            <Plus size={14} /> Add Points
                          </button>
                          {isRummy && (
                            <button
                              onClick={() => handleEliminate(player.id)}
                              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30"
                              title="Eliminate player"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* End Session Button */}
            <div className="flex gap-3">
              <button
                onClick={handleEndGame}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <Square size={18} />
                End Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Points Modal */}
      {showPointsModal && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full border border-slate-700">
            <h3 className="text-xl font-bold text-slate-50 mb-4">
              Add Points to {selectedPlayer.name}
            </h3>
            
            <input
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="Enter points"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg text-center mb-4"
              autoFocus
            />

            {/* Quick point buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 10, 20, 50].map(pts => (
                <button
                  key={pts}
                  onClick={() => setPointsInput(pts.toString())}
                  className="py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
                >
                  +{pts}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowPointsModal(false); setSelectedPlayer(null); }}
                className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddPoints}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Check size={18} /> Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full border border-slate-700">
            <h3 className="text-xl font-bold text-slate-50 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-400" /> Record Winner
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Select who won this round:
            </p>

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {activePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleRecordWinner(player.id)}
                  className="w-full p-4 bg-slate-700 hover:bg-green-900/30 border border-slate-600 hover:border-green-500 rounded-xl text-left flex justify-between items-center transition-all"
                >
                  <span className="font-bold text-slate-50">{player.name}</span>
                  <span className="text-sm text-slate-400">
                    {player.score || player.sessionBalance || 0} pts
                  </span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowWinnerModal(false)}
              className="w-full py-3 bg-slate-700 text-slate-300 rounded-xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Round Summary Modal */}
      {showRoundSummary && roundSummaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full text-center border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
            <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
            <h2 className="text-3xl font-black text-slate-50 mb-1 uppercase">
              Round Complete!
            </h2>
            <p className="text-2xl font-bold text-blue-400 mb-6">{roundSummaryData.winner?.name}</p>

            <div className="bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-500/30">
              <p className="text-blue-400 uppercase text-xs font-bold tracking-widest mb-1">Round</p>
              <p className="text-2xl font-black text-slate-50">
                {roundSummaryData.currentRound} of {gameState?.totalRounds || session?.totalRounds || 10}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Current Scores</h3>
              <div className="space-y-2">
                {(gameState?.players || players).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-xl">
                    <span className="font-bold text-slate-50">{p.name}</span>
                    <span className={`font-bold ${p.status === 'ELIMINATED' ? 'text-red-400' : 'text-green-400'}`}>
                      {p.score || p.sessionBalance || 0} {p.status === 'ELIMINATED' ? '(ELIMINATED)' : 'pts'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {roundSummaryData.eliminated && roundSummaryData.eliminated.length > 0 && (
              <div className="mb-6 bg-red-900/20 rounded-xl p-4 border border-red-500/30">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Eliminated</h3>
                <p className="text-red-300">{roundSummaryData.eliminated.join(', ')}</p>
              </div>
            )}

            {!roundSummaryData.isSessionOver && (
              <div className="mb-4">
                <button 
                  onClick={() => setShowPlayerRequestModal(true)}
                  className="w-full py-3 bg-green-500/20 border-2 border-green-500/30 text-green-400 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <UserPlus size={20} /> Request New Players
                </button>
              </div>
            )}

            <button 
              onClick={handleNextRound} 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg"
            >
              {roundSummaryData.isSessionOver ? 'View Final Results' : 'Next Round'}
            </button>
          </div>
        </div>
      )}

      {/* Session Ended Modal */}
      {showSessionSummary && sessionSummaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full text-center border border-slate-700">
            <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
            <h2 className="text-3xl font-black text-slate-50 mb-4">Game Complete!</h2>
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
              <p className="text-slate-400 text-sm">Final Round</p>
              <p className="text-2xl font-black text-slate-50">
                {sessionSummaryData.finalRound} / {sessionSummaryData.totalRounds}
              </p>
            </div>
            <button 
              onClick={() => navigate('/operator/sessions')} 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSession;

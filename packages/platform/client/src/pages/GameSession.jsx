import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Play, Square, RotateCcw, 
  AlertCircle, Wifi, WifiOff, Trophy, X, Check, UserPlus,
  Minus, Plus, AlertTriangle
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  
  const [roundSummaryData, setRoundSummaryData] = useState(null);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [viewerRequests, setViewerRequests] = useState([]);
  const [showPlayerRequestModal, setShowPlayerRequestModal] = useState(false);
  const [newPlayerNames, setNewPlayerNames] = useState('');
  
  // Rummy specific modals
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);
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

  // Points Modal
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

  // Drop Modal (Rummy)
  const openDropModal = (player) => {
    setSelectedPlayer(player);
    setShowDropModal(true);
  };

  const handleDrop = (dropType) => {
    sendGameAction('RECORD_DROP', { playerId: selectedPlayer.id, dropType });
    setShowDropModal(false);
    setSelectedPlayer(null);
  };

  // Winner Modal
  const openWinnerModal = () => {
    setShowWinnerModal(true);
  };

  const handleRecordWinner = (winnerId) => {
    sendGameAction('RECORD_WINNER', { winnerId });
    setShowWinnerModal(false);
  };

  // Wrong Show
  const handleWrongShow = (loserId) => {
    if (confirm('Apply Wrong Show penalty (80 points) to this player?')) {
      sendGameAction('RECORD_POINTS', { playerId: loserId, points: 80 });
    }
  };

  // Eliminate
  const handleEliminate = (playerId) => {
    if (confirm('Are you sure you want to eliminate this player?')) {
      sendGameAction('ELIMINATE_PLAYER', { playerId });
    }
  };

  // Viewer
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

  // Get sorted leaderboard
  const getLeaderboard = () => {
    return [...(gameState?.players || players)]
      .filter(p => p.status !== 'GUEST')
      .sort((a, b) => (a.score || a.sessionBalance || 0) - (b.score || b.sessionBalance || 0));
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
  const leaderboard = getLeaderboard();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/operator/sessions')} className="p-2 text-slate-400 hover:text-slate-100">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-50">{decodeURIComponent(sessionName)}</h1>
                <p className="text-sm text-slate-400">
                  {session?.gameName} • Round {gameState?.currentRound || 1}/{gameState?.totalRounds || session?.totalRounds || 10}
                  {isRummy && ` • Target: ${gameState?.targetScore || session?.targetScore || 100}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <span className="text-green-400 flex items-center gap-1"><Wifi size={16} /> Live</span>
              ) : (
                <span className="text-red-400 flex items-center gap-1"><WifiOff size={16} /> Offline</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Game Logs */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Game Log</h3>
          <div className="h-24 overflow-y-auto text-sm space-y-1">
            {gameState?.currentLogs?.slice(-5).map((log, i) => (
              <div key={i} className="text-slate-300">{log}</div>
            )) || <div className="text-slate-500">No activity yet</div>}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              Leaderboard
            </h2>
            {isRummy && (
              <span className="text-sm text-slate-400">Lowest points wins!</span>
            )}
          </div>
          
          <div className="space-y-2">
            {leaderboard.map((player, idx) => {
              const isEliminated = player.status === 'ELIMINATED';
              return (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    idx === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-slate-700/50'
                  } ${isEliminated ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-400 text-black' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-slate-600 text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-medium text-slate-50">{player.name}</div>
                      {isEliminated && <span className="text-xs text-red-400">ELIMINATED</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${(player.score || player.sessionBalance || 0) >= (gameState?.targetScore || 100) ? 'text-red-400' : 'text-green-400'}`}>
                      {player.score || player.sessionBalance || 0}
                    </div>
                    <div className="text-xs text-slate-500">points</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {currentPhase === 'SETUP' && isOperatorOrAdmin && (
          <div className="space-y-4">
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <Play size={20} /> Start Round
            </button>
            
            {players.length < 2 && (
              <p className="text-center text-red-400 text-sm">Need at least 2 players</p>
            )}
          </div>
        )}

        {currentPhase !== 'SETUP' && isOperatorOrAdmin && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openWinnerModal}
              className="py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <Trophy size={18} /> Record Winner
            </button>
            <button
              onClick={handleEndGame}
              className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <Square size={18} /> End Session
            </button>
          </div>
        )}

        {/* Player Actions (Rummy specific) */}
        {isRummy && currentPhase !== 'SETUP' && isOperatorOrAdmin && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Round Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(gameState?.players || players).map(player => {
                if (player.status === 'ELIMINATED') return null;
                
                return (
                  <div key={player.id} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-50">{player.name}</span>
                      <span className="text-sm text-green-400 font-bold">{player.score || 0} pts</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Drop Initial */}
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          sendGameAction('RECORD_DROP', { playerId: player.id, dropType: 'initial' });
                        }}
                        className="py-1.5 bg-orange-600/20 border border-orange-500/30 text-orange-400 rounded text-xs font-medium hover:bg-orange-600/30"
                      >
                        Drop (20)
                      </button>
                      
                      {/* Drop Middle */}
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          sendGameAction('RECORD_DROP', { playerId: player.id, dropType: 'middle' });
                        }}
                        className="py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded text-xs font-medium hover:bg-red-600/30"
                      >
                        Drop (40)
                      </button>
                      
                      {/* Add Points */}
                      <button
                        onClick={() => openPointsModal(player)}
                        className="py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded text-xs font-medium hover:bg-blue-600/30"
                      >
                        + Points
                      </button>
                      
                      {/* Wrong Show */}
                      <button
                        onClick={() => handleWrongShow(player.id)}
                        className="py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded text-xs font-medium hover:bg-purple-600/30 flex items-center justify-center gap-1"
                      >
                        <AlertTriangle size={12} /> Wrong Show
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teen Patti Actions */}
        {!isRummy && currentPhase !== 'SETUP' && isOperatorOrAdmin && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Pot Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(gameState?.players || players).map(player => {
                if (player.status === 'ELIMINATED') return null;
                return (
                  <div key={player.id} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-50">{player.name}</span>
                      <span className="text-sm text-green-400 font-bold">+{player.sessionBalance || 0}</span>
                    </div>
                    <button
                      onClick={() => openPointsModal(player)}
                      className="w-full py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded text-sm font-medium hover:bg-blue-600/30"
                    >
                      Add Winnings
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Points Modal */}
      {showPointsModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-xl max-w-sm w-full border border-slate-700">
            <h3 className="text-lg font-bold text-slate-50 mb-4">
              Add Points to {selectedPlayer.name}
            </h3>
            
            <input
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="Enter points"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-lg mb-3"
              autoFocus
            />

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 10, 20, 50].map(pts => (
                <button
                  key={pts}
                  onClick={() => setPointsInput(pts.toString())}
                  className="py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                >
                  +{pts}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPointsModal(false)}
                className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddPoints}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-6 rounded-xl max-w-sm w-full border border-slate-700">
            <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-400" /> Record Winner
            </h3>
            
            <p className="text-slate-400 text-sm mb-4">Select who won this round:</p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {leaderboard.filter(p => p.status !== 'ELIMINATED').map(player => (
                <button
                  key={player.id}
                  onClick={() => handleRecordWinner(player.id)}
                  className="w-full p-4 bg-slate-700 hover:bg-green-900/30 border border-slate-600 hover:border-green-500 rounded-lg text-left flex justify-between items-center"
                >
                  <span className="font-bold text-slate-50">{player.name}</span>
                  <span className="text-sm text-slate-400">{player.score || player.sessionBalance || 0} pts</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowWinnerModal(false)}
              className="w-full py-3 bg-slate-700 text-slate-300 rounded-lg font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Round Summary Modal */}
      {showRoundSummary && roundSummaryData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full text-center border border-slate-700">
            <Trophy className="mx-auto text-yellow-500 mb-4" size={48} />
            <h2 className="text-2xl font-black text-slate-50 mb-2">Round Complete!</h2>
            {roundSummaryData.winner && (
              <p className="text-xl text-blue-400 mb-4">Winner: {roundSummaryData.winner.name}</p>
            )}

            <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-400 mb-2">Current Standings</p>
              {leaderboard.map((p, i) => (
                <div key={p.id} className="flex justify-between text-slate-300">
                  <span>{i+1}. {p.name}</span>
                  <span>{p.score || p.sessionBalance || 0}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={handleNextRound} 
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold"
            >
              {roundSummaryData.isSessionOver ? 'View Results' : 'Next Round'}
            </button>
          </div>
        </div>
      )}

      {/* Session Ended Modal */}
      {showSessionSummary && sessionSummaryData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-8 rounded-xl max-w-md w-full text-center border border-slate-700">
            <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
            <h2 className="text-2xl font-black text-slate-50 mb-4">Game Complete!</h2>
            <button 
              onClick={() => navigate('/operator/sessions')} 
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold"
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

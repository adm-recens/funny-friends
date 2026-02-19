import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Play, Square, RotateCcw, 
  Clock, DollarSign, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const GameSession = () => {
  const { sessionName } = useParams();
  const navigate = useNavigate();
  const { user, socket } = useAuth();
  const [session, setSession] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting');

  // Fetch session details and players
  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        // Get sessions list
        const sessionsRes = await fetch(`${API_URL}/api/v2/sessions`, {
          credentials: 'include'
        });
        
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          const sessionData = data.sessions?.find(s => s.name === decodeURIComponent(sessionName));
          
          if (sessionData) {
            setSession(sessionData);
            setSessionStatus(sessionData.status || 'waiting');
            
            // Fetch players for this session
            const playersRes = await fetch(`${API_URL}/api/sessions/${encodeURIComponent(sessionName)}/players`, {
              credentials: 'include'
            });
            
            if (playersRes.ok) {
              const playersData = await playersRes.json();
              setPlayers(playersData.players || []);
            }
          } else {
            setError('Session not found');
          }
        }
      } catch (e) {
        console.error('Failed to fetch session:', e);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionName]);

  // Setup socket connection using AuthContext socket
  useEffect(() => {
    if (!socket) return;

    console.log('Setting up socket listeners for session:', sessionName);
    const decodedSessionName = decodeURIComponent(sessionName);

    // Function to join session
    const joinSession = () => {
      console.log('Emitting join_session for:', decodedSessionName);
      socket.emit('join_session', { 
        sessionName: decodedSessionName, 
        role: 'OPERATOR' 
      });
    };

    // Socket event handlers
    const onConnect = () => {
      console.log('Socket connected in GameSession');
      setIsConnected(true);
      setError('');
      // Re-join session on reconnect
      joinSession();
    };

    const onDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    };

    const onGameUpdate = (state) => {
      console.log('Game update received:', state);
      setGameState(state);
      if (state.players && state.players.length > 0) {
        setPlayers(state.players);
      }
      if (state.phase) {
        setSessionStatus(state.phase.toLowerCase());
      }
    };

    const onErrorMessage = (message) => {
      console.error('Socket error:', message);
      setError(message);
    };

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_update', onGameUpdate);
    socket.on('error_message', onErrorMessage);

    // Connect socket if not already connected
    if (!socket.connected) {
      console.log('Connecting socket...');
      socket.connect();
    } else {
      // Already connected, join immediately
      joinSession();
    }

    // Check initial connection state
    setIsConnected(socket.connected);

    // Cleanup
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_update', onGameUpdate);
      socket.off('error_message', onErrorMessage);
      
      // Leave the session room
      socket.emit('leave_session', { sessionName: decodedSessionName });
    };
  }, [socket, sessionName]);

  const handleStartGame = () => {
    if (socket && isConnected) {
      console.log('Starting game...');
      socket.emit('game_action', { 
        sessionName: decodeURIComponent(sessionName), 
        action: { type: 'START_GAME' } 
      });
    } else {
      setError('Not connected to game server');
    }
  };

  const handleEndGame = () => {
    if (socket && isConnected && confirm('Are you sure you want to end this session?')) {
      console.log('Ending session...');
      socket.emit('game_action', { 
        sessionName: decodeURIComponent(sessionName), 
        action: { type: 'END_SESSION' } 
      });
    }
  };

  const handleNextRound = () => {
    if (socket && isConnected) {
      console.log('Next round...');
      socket.emit('game_action', { 
        sessionName: decodeURIComponent(sessionName), 
        action: { type: 'NEXT_ROUND' } 
      });
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-violet-900/20 via-slate-900 to-slate-900" />
      
      {/* Header */}
      <div className="relative border-b border-slate-800">
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
                  {session?.gameName || session?.gameCode} • {players.length} players
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi size={16} className="text-green-500" />
              ) : (
                <WifiOff size={16} className="text-red-500" />
              )}
              <span className={`text-xs hidden sm:inline ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Status Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50">Game Status</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseBadgeColor(currentPhase)}`}>
                  {currentPhase}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <RotateCcw size={14} />
                    {session?.gameLimitType === 'points' || gameState?.gameLimitType === 'points' ? 'Target Score' : 'Total Rounds'}
                  </div>
                  <div className="text-xl font-bold text-slate-50">
                    {session?.targetScore || session?.totalRounds || gameState?.targetScore || gameState?.totalRounds || '-'}
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Clock size={14} />
                    Current Round
                  </div>
                  <div className="text-xl font-bold text-slate-50">
                    {gameState?.currentRound || session?.currentRound || 1}
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Users size={14} />
                    Players
                  </div>
                  <div className="text-xl font-bold text-slate-50">
                    {players.length}
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <DollarSign size={14} />
                    Pot
                  </div>
                  <div className="text-xl font-bold text-slate-50">
                    {gameState?.pot || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-50 mb-4">Game Controls</h2>
              <div className="flex flex-wrap gap-3">
                {!isConnected ? (
                  <div className="w-full p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      Connecting to game server... Please wait.
                    </p>
                  </div>
                ) : currentPhase === 'SETUP' || currentPhase === 'WAITING' ? (
                  <button
                    onClick={handleStartGame}
                    disabled={players.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    <Play size={18} />
                    Start Game
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleNextRound}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <RotateCcw size={18} />
                      Next Round
                    </button>
                    <button
                      onClick={handleEndGame}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Square size={18} />
                      End Session
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Players Sidebar */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
              <Users size={18} className="text-violet-400" />
              Players
            </h2>
            
            {players.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No players yet</p>
                <p className="text-slate-500 text-xs">
                  Players will appear here when they join
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                    <div className="text-right">
                      <div className={`font-bold ${
                        (player.sessionBalance || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(player.sessionBalance || 0) >= 0 ? '+' : ''}{player.sessionBalance || 0}
                      </div>
                      <div className="text-xs text-slate-500">
                        {player.status || 'ACTIVE'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSession;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  ArrowLeft, Users, Play, Square, RotateCcw, 
  Trophy, Clock, DollarSign, AlertCircle 
} from 'lucide-react';
import { API_URL, SOCKET_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const GameSession = () => {
  const { sessionName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [session, setSession] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v2/sessions`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const sessionData = data.sessions?.find(s => s.name === decodeURIComponent(sessionName));
          if (sessionData) {
            setSession(sessionData);
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

    fetchSession();
  }, [sessionName]);

  // Setup socket connection
  useEffect(() => {
    if (!session) return;

    const newSocket = io(SOCKET_URL || API_URL, {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join session as operator
      newSocket.emit('join_session', { 
        sessionName: decodeURIComponent(sessionName), 
        role: 'OPERATOR' 
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('game_update', (state) => {
      console.log('Game update received:', state);
      setGameState(state);
      if (state.players) {
        setPlayers(state.players);
      }
    });

    newSocket.on('error_message', (message) => {
      setError(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session]);

  const handleStartGame = () => {
    if (socket) {
      socket.emit('game_action', { 
        sessionName: decodeURIComponent(sessionName), 
        action: { type: 'START_GAME' } 
      });
    }
  };

  const handleEndGame = () => {
    if (socket && confirm('Are you sure you want to end this session?')) {
      socket.emit('game_action', { 
        sessionName: decodeURIComponent(sessionName), 
        action: { type: 'END_SESSION' } 
      });
    }
  };

  const handleNextRound = () => {
    if (socket) {
      socket.emit('game_action', { 
        sessionName: decodeURIComponent(sessionName), 
        action: { type: 'NEXT_ROUND' } 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      </div>
    );
  }

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
                  {session?.gameName} • {players.length} players
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400 hidden sm:inline">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Status Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-50">Game Status</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  gameState?.phase === 'ACTIVE' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {gameState?.phase || 'SETUP'}
                </span>
              </div>
              
              {gameState && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <RotateCcw size={14} />
                      {gameState.gameLimitType === 'points' ? 'Target Score' : 'Total Rounds'}
                    </div>
                    <div className="text-xl font-bold text-slate-50">
                      {gameState.gameLimitType === 'points' 
                        ? gameState.targetScore 
                        : gameState.totalRounds}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Clock size={14} />
                      Current Round
                    </div>
                    <div className="text-xl font-bold text-slate-50">
                      {gameState.currentRound || 1}
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
                      {gameState.pot || 0}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Game Controls */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-50 mb-4">Game Controls</h2>
              <div className="flex flex-wrap gap-3">
                {gameState?.phase === 'SETUP' ? (
                  <button
                    onClick={handleStartGame}
                    disabled={!isConnected || players.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    <Play size={18} />
                    Start Game
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleNextRound}
                      disabled={!isConnected}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      <RotateCcw size={18} />
                      Next Round
                    </button>
                    <button
                      onClick={handleEndGame}
                      disabled={!isConnected}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
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
              <p className="text-slate-400 text-center py-8">No players yet</p>
            ) : (
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {player.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-50">{player.name}</div>
                        <div className="text-xs text-slate-400">Seat {player.seat}</div>
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, Users, Gamepad2, ArrowLeft, Trash2, 
  CheckCircle, AlertCircle 
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const SessionSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    totalRounds: 10,
    targetScore: 100,
    gameCode: searchParams.get('game') || ''
  });
  
  const [players, setPlayers] = useState([
    { name: '', seat: 1 }
  ]);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gametypes`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setGames(data.filter(g => g.isActive));
        
        const gameCode = searchParams.get('game');
        if (gameCode) {
          const game = data.find(g => g.code === gameCode);
          if (game) setSelectedGame(game);
        }
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  };

  const handleAddPlayer = () => {
    if (players.length >= 17) {
      setError('Maximum 17 players allowed');
      return;
    }
    setPlayers([...players, { name: '', seat: players.length + 1 }]);
  };

  const handleRemovePlayer = (index) => {
    if (players.length <= 1) {
      setError('At least 1 player required');
      return;
    }
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers.map((p, i) => ({ ...p, seat: i + 1 })));
  };

  const handlePlayerChange = (index, field, value) => {
    const newPlayers = [...players];
    newPlayers[index][field] = value;
    setPlayers(newPlayers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Session name is required');
      setLoading(false);
      return;
    }

    if (!selectedGame) {
      setError('Please select a game');
      setLoading(false);
      return;
    }

    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < selectedGame.minPlayers) {
      setError(`At least ${selectedGame.minPlayers} players required for ${selectedGame.name}`);
      setLoading(false);
      return;
    }

    if (validPlayers.length > selectedGame.maxPlayers) {
      setError(`Maximum ${selectedGame.maxPlayers} players allowed for ${selectedGame.name}`);
      setLoading(false);
      return;
    }

    try {
      // Prepare game-specific configuration
      const gameConfig = selectedGame.code === 'rummy' 
        ? { 
            targetScore: parseInt(formData.targetScore),
            gameLimitType: 'points'
          }
        : { 
            totalRounds: parseInt(formData.totalRounds),
            gameLimitType: 'rounds'
          };

      const res = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          gameCode: selectedGame.code,
          ...gameConfig,
          players: validPlayers.map((p, i) => ({
            name: p.name.trim(),
            seat: i + 1
          }))
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to operator sessions to see the created session
        navigate('/operator/sessions');
      } else {
        setError(data.error || data.message || 'Failed to create session');
      }
    } catch (e) {
      console.error('Create session error:', e);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-violet-900/20 via-slate-900 to-slate-900" />
      
      {/* Header */}
      <div className="relative border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/operator/sessions')}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-50">Create New Session</h1>
              <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Set up a new game session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <div className="mb-4 sm:mb-6 flex items-center gap-3 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-4 sm:space-y-6">
          {/* Session Details */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-slate-50">
              <Gamepad2 size={18} className="text-violet-400" />
              Session Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Session Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="e.g., Friday Night Game"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Game *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        setSelectedGame(game);
                        setFormData({...formData, gameCode: game.code});
                      }}
                      className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                        selectedGame?.id === game.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                          {game.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-50 text-sm sm:text-base">{game.name}</h3>
                          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{game.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {game.minPlayers}-{game.maxPlayers} players
                          </p>
                        </div>
                        {selectedGame?.id === game.id && (
                          <CheckCircle size={18} className="text-violet-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game-specific Configuration */}
              {selectedGame && (
                <div>
                  {selectedGame.code === 'teen-patti' ? (
                    <>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Number of Rounds
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.totalRounds}
                        onChange={(e) => setFormData({...formData, totalRounds: e.target.value})}
                        className="w-24 sm:w-32 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Game ends after this many rounds
                      </p>
                    </>
                  ) : selectedGame.code === 'rummy' ? (
                    <>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Points
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="500"
                        step="10"
                        value={formData.targetScore}
                        onChange={(e) => setFormData({...formData, targetScore: e.target.value})}
                        className="w-24 sm:w-32 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        First player to reach this score wins
                      </p>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Players */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-slate-50">
                <Users size={18} className="text-violet-400" />
                Players
              </h2>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors text-xs sm:text-sm font-medium"
              >
                <Plus size={14} />
                Add Player
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium text-slate-300 flex-shrink-0">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                    placeholder={`Player ${index + 1} name`}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(index)}
                    className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                    disabled={players.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400">
              {selectedGame ? (
                <>Add {selectedGame.minPlayers}-{selectedGame.maxPlayers} players for {selectedGame.name}</>
              ) : (
                'Select a game to see player requirements'
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/operator/sessions')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-800 transition-colors text-sm sm:text-base order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Session...
                </span>
              ) : (
                'Create Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionSetup;

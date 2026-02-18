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
    gameCode: searchParams.get('game') || ''
  });
  
  const [players, setPlayers] = useState([
    { name: '', seat: 1 }
  ]);

  // Fetch available games
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
        
        // Pre-select game from URL param
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
    // Reassign seats
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

    // Validation
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

    // Validate all players have names
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
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          totalRounds: parseInt(formData.totalRounds),
          gameCode: selectedGame.code,
          players: validPlayers.map((p, i) => ({
            name: p.name.trim(),
            seat: i + 1
          }))
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Navigate to the session
        navigate(`/operator/sessions`);
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/operator/sessions')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create New Session</h1>
              <p className="text-sm text-slate-500">Set up a new game session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Gamepad2 size={20} className="text-purple-600" />
              Session Details
            </h2>
            
            <div className="space-y-4">
              {/* Session Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Friday Night Game"
                  required
                />
              </div>

              {/* Game Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Game *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        setSelectedGame(game);
                        setFormData({...formData, gameCode: game.code});
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedGame?.id === game.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                          {game.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{game.name}</h3>
                          <p className="text-sm text-slate-500">{game.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {game.minPlayers}-{game.maxPlayers} players
                          </p>
                        </div>
                        {selectedGame?.id === game.id && (
                          <CheckCircle size={20} className="text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Rounds */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Rounds
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.totalRounds}
                  onChange={(e) => setFormData({...formData, totalRounds: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Players
              </h2>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Add Player
              </button>
            </div>

            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-medium text-slate-600">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                    placeholder={`Player ${index + 1} name`}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={players.length <= 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-500">
              {selectedGame ? (
                <>Add {selectedGame.minPlayers}-{selectedGame.maxPlayers} players for {selectedGame.name}</>
              ) : (
                'Select a game to see player requirements'
              )}
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/operator/sessions')}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Session...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionSetup;

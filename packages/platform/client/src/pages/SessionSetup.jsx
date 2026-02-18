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
    <div className="page-container">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-primary-900/20 via-slate-900 to-slate-900" />
      
      {/* Header */}
      <div className="relative border-b border-slate-800">
        <div className="page-content">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/operator/sessions')}
              className="btn-ghost p-2"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Create New Session</h1>
              <p className="text-slate-400">Set up a new game session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative page-content">
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Session Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gamepad2 size={20} className="text-primary-400" />
              Session Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Session Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Friday Night Game"
                  required
                />
              </div>

              <div>
                <label className="form-label">Select Game *</label>
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
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex-center text-2xl">
                          {game.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-50">{game.name}</h3>
                          <p className="text-sm text-slate-400">{game.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {game.minPlayers}-{game.maxPlayers} players
                          </p>
                        </div>
                        {selectedGame?.id === game.id && (
                          <CheckCircle size={20} className="text-primary-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Total Rounds</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.totalRounds}
                  onChange={(e) => setFormData({...formData, totalRounds: e.target.value})}
                  className="form-input w-32"
                />
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="card p-6">
            <div className="flex-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} className="text-primary-400" />
                Players
              </h2>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="btn-secondary"
              >
                <Plus size={16} />
                Add Player
              </button>
            </div>

            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex-center text-sm font-medium text-slate-300">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                    placeholder={`Player ${index + 1} name`}
                    className="form-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(index)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    disabled={players.length <= 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-400">
              {selectedGame ? (
                <>Add {selectedGame.minPlayers}-{selectedGame.maxPlayers} players for {selectedGame.name}</>
              ) : (
                'Select a game to see player requirements'
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/operator/sessions')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
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

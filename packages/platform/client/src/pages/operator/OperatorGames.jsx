import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Users, Plus, CheckCircle, XCircle, Play } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const OperatorGames = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      // Use the v2 endpoint that returns only games user has permission for
      const res = await fetch(`${API_URL}/api/v2/games`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // The v2 endpoint already filters by permissions
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAccessGame = (game) => {
    // Admin always has access
    if (user?.role === 'ADMIN') return true;
    // For operators, check if they have canCreate permission for this game
    return game.canCreate === true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-50">Available Games</h2>
        <p className="text-slate-400">Games you can create sessions for</p>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => {
            const hasAccess = canAccessGame(game);
            
            return (
              <div 
                key={game.id}
                className={`bg-slate-800 rounded-xl border overflow-hidden transition-all ${
                  hasAccess 
                    ? 'border-slate-700 hover:border-slate-600 hover:shadow-lg cursor-pointer' 
                    : 'border-slate-800 opacity-60'
                }`}
                onClick={() => hasAccess && navigate(`/sessions/new?game=${game.code}`)}
              >
                <div className="p-6">
                  {/* Game Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl flex items-center justify-center text-3xl">
                      {game.icon || '🎮'}
                    </div>
                    {hasAccess ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle size={12} />
                        Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600">
                        <XCircle size={12} />
                        No Access
                      </span>
                    )}
                  </div>

                  {/* Game Info */}
                  <h3 className="text-xl font-bold text-slate-50 mb-2">{game.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{game.description}</p>

                  {/* Game Details */}
                  <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {game.minPlayers}-{game.maxPlayers}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      game.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                      game.status === 'BETA' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {game.status}
                    </span>
                  </div>

                  {/* Action Button */}
                  {hasAccess ? (
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                      <Plus size={18} />
                      Create Session
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-slate-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      Contact Admin for Access
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="font-medium text-blue-400 mb-2">Need Access to a Game?</h4>
        <p className="text-sm text-blue-300">
          If you need access to a specific game, please contact your administrator. 
          They can grant you permissions from the Admin Control Panel.
        </p>
      </div>
    </div>
  );
};

export default OperatorGames;

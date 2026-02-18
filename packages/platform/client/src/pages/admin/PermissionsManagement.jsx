import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Search, Gamepad2, CheckCircle, XCircle, 
  Settings, Trash2, Edit2, MoreVertical, Eye, Power
} from 'lucide-react';
import { API_URL } from '../../config';

const PermissionsManagement = () => {
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gamesRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/gametypes`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/users`, { credentials: 'include' })
      ]);

      if (gamesRes.ok) {
        setGames(await gamesRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGameStatus = async (gameId, isActive) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive })
      });

      if (res.ok) {
        showNotification(`Game ${isActive ? 'enabled' : 'disabled'} successfully`, 'success');
        fetchData();
      } else {
        showNotification('Failed to update game status', 'error');
      }
    } catch (error) {
      showNotification('Error updating game', 'error');
    }
  };

  const handleUpdateUserPermission = async (userId, gameId, permission) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, gameId, ...permission })
      });

      if (res.ok) {
        showNotification('Permission updated successfully', 'success');
        fetchData();
      } else {
        showNotification('Failed to update permission', 'error');
      }
    } catch (error) {
      showNotification('Error updating permission', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getUserPermissionsForGame = (userId, gameId) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.allowedGames) return false;
    return user.allowedGames.includes(gameId);
  };

  const operators = users.filter(u => u.role === 'OPERATOR');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Permissions & Access Control</h2>
          <p className="text-slate-500">Manage game permissions and user access rights</p>
        </div>
      </div>

      {/* Games Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Gamepad2 size={20} />
            Game Management
          </h3>
          <p className="text-sm text-slate-500 mt-1">Enable or disable games on the platform</p>
        </div>

        <div className="divide-y divide-slate-200">
          {games.map((game) => (
            <div key={game.id} className="p-6 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  game.isActive ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  {game.icon || '🎮'}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{game.name}</h4>
                  <p className="text-sm text-slate-500">
                    {game.minPlayers}-{game.maxPlayers} players • {game.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleUpdateGameStatus(game.id, !game.isActive)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    game.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {game.isActive ? (
                    <span className="flex items-center gap-2">
                      <Power size={16} />
                      Disable
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Power size={16} />
                      Enable
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operator Permissions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield size={20} />
            Operator Permissions
          </h3>
          <p className="text-sm text-slate-500 mt-1">Configure which games each operator can manage</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">Operator</th>
                {games.map(game => (
                  <th key={game.id} className="text-center py-4 px-4 text-sm font-semibold text-slate-700">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xl">{game.icon || '🎮'}</span>
                      <span>{game.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {operators.map(operator => (
                <tr key={operator.id} className="hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {operator.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{operator.username}</p>
                        <p className="text-sm text-slate-500">{operator.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  {games.map(game => (
                    <td key={game.id} className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleUpdateUserPermission(
                          operator.id, 
                          game.id, 
                          { canCreate: !getUserPermissionsForGame(operator.id, game.id) }
                        )}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          getUserPermissionsForGame(operator.id, game.id)
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {getUserPermissionsForGame(operator.id, game.id) ? (
                          <CheckCircle size={24} />
                        ) : (
                          <XCircle size={24} />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {operators.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No operators found. Create operators in User Management.
          </div>
        )}
      </div>

      {/* Permission Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Permission Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm text-blue-700">
          <span className="flex items-center gap-1">
            <CheckCircle size={16} className="text-green-600" />
            <span>Access Granted - Operator can manage this game</span>
          </span>
          <span className="flex items-center gap-1">
            <XCircle size={16} className="text-slate-400" />
            <span>No Access - Operator cannot manage this game</span>
          </span>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default PermissionsManagement;

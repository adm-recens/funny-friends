import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Users, Clock, Gamepad2, CheckCircle, XCircle,
  Search, Filter, Trash2, Eye
} from 'lucide-react';
import { API_URL } from '../../config';

const AdminSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v2/sessions`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionName) => {
    if (!confirm(`Are you sure you want to delete session "${sessionName}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/sessions/${encodeURIComponent(sessionName)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        setSessions(sessions.filter(s => s.name !== sessionName));
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && session.isActive) ||
      (filter === 'ended' && !session.isActive);
    
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.gameType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50">All Sessions</h2>
          <p className="text-slate-400">Manage all game sessions across the platform</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            Total: <span className="text-slate-50 font-semibold">{sessions.length}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Sessions</option>
            <option value="active">Active Only</option>
            <option value="ended">Ended Only</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <Gamepad2 className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-50 mb-2">No sessions found</h3>
          <p className="text-slate-400">
            {searchTerm ? 'Try adjusting your search' : 'No sessions match the selected filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div 
              key={session.id}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
            >
              <div className="p-6">
                {/* Session Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                      <Gamepad2 className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-50">{session.name}</h3>
                      <p className="text-sm text-slate-400">{session.gameType}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.isActive 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {session.isActive ? 'Active' : 'Ended'}
                  </span>
                </div>

                {/* Session Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Play size={14} />
                      Round
                    </div>
                    <div className="text-sm font-medium text-slate-50">
                      {session.currentRound} / {session.totalRounds || session.targetScore || '-'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Users size={14} />
                      Players
                    </div>
                    <div className="text-sm font-medium text-slate-50">
                      {session.playerCount || 0}
                    </div>
                  </div>
                </div>

                {/* Session Info */}
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    session.status === 'ACTIVE' || session.status === 'playing'
                      ? 'bg-green-500/10 text-green-400'
                      : session.status === 'waiting'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {session.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/game/${encodeURIComponent(session.name)}`)}
                    disabled={!session.isActive}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.name)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSessions;

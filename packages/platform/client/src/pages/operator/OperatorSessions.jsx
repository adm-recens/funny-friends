import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Gamepad2, Users, Clock, Play, 
  Eye, Trash2, CheckCircle, XCircle, Filter
} from 'lucide-react';
import { API_URL } from '../../config';

const OperatorSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/sessions`, {
        credentials: 'include'
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (sessionName) => {
    if (!window.confirm(`End session "${sessionName}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/sessions/${sessionName}/end`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'ACTIVE' && session.isActive) ||
      (filterStatus === 'ENDED' && !session.isActive);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive) => {
    return isActive 
      ? { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle, text: 'Active' }
      : { color: 'bg-slate-700 text-slate-400 border-slate-600', icon: XCircle, text: 'Ended' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50">My Sessions</h2>
          <p className="text-slate-400">Manage your game sessions</p>
        </div>
        <button
          onClick={() => navigate('/sessions/new')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="ALL">All Sessions</option>
            <option value="ACTIVE">Active</option>
            <option value="ENDED">Ended</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <Gamepad2 size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-50 mb-2">No Sessions Found</h3>
          <p className="text-slate-400 mb-4">
            {searchQuery || filterStatus !== 'ALL' 
              ? 'Try adjusting your filters'
              : 'Create your first session to get started'}
          </p>
          <button
            onClick={() => navigate('/sessions/new')}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Create Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const status = getStatusBadge(session.isActive);
            return (
              <div 
                key={session.id}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center">
                        <Gamepad2 size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-50">{session.name}</h3>
                        <p className="text-sm text-slate-400">{session.gameType?.name}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      <status.icon size={12} />
                      {status.text}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Round</span>
                      <span className="font-medium text-slate-200">
                        {session.currentRound} / {session.totalRounds}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Players</span>
                      <span className="font-medium text-slate-200 flex items-center gap-1">
                        <Users size={14} />
                        {session.playerCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Created</span>
                      <span className="text-slate-200 flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {session.isActive ? (
                      <>
                        <button
                          onClick={() => navigate(`/game/${session.name}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                        >
                          <Play size={16} />
                          Join
                        </button>
                        <button
                          onClick={() => handleEndSession(session.name)}
                          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/game/${session.name}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperatorSessions;

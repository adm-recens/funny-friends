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
      ? { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Active' }
      : { color: 'bg-slate-100 text-slate-700', icon: XCircle, text: 'Ended' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Sessions</h2>
          <p className="text-slate-500">Manage your game sessions</p>
        </div>
        <button
          onClick={() => navigate('/sessions/new')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Gamepad2 size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Sessions Found</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery || filterStatus !== 'ALL' 
              ? 'Try adjusting your filters'
              : 'Create your first session to get started'}
          </p>
          <button
            onClick={() => navigate('/sessions/new')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Gamepad2 size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{session.name}</h3>
                        <p className="text-sm text-slate-500">{session.gameType?.name}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <status.icon size={12} />
                      {status.text}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Round</span>
                      <span className="font-medium text-slate-900">
                        {session.currentRound} / {session.totalRounds}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Players</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <Users size={14} />
                        {session.playerCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Created</span>
                      <span className="text-slate-900 flex items-center gap-1">
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
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Play size={16} />
                          Join
                        </button>
                        <button
                          onClick={() => handleEndSession(session.name)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/game/${session.name}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
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

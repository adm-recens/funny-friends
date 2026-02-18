import React, { useState, useEffect } from 'react';
import { Users, Gamepad2, Activity, TrendingUp, Shield, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

const OperatorDashboardOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalSessions: 0,
    totalPlayers: 0,
    availableGames: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, gamesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/sessions`, { credentials: 'include' }),
        fetch(`${API_URL}/api/gametypes`, { credentials: 'include' })
      ]);

      const sessions = sessionsRes.ok ? await sessionsRes.json() : [];
      const games = gamesRes.ok ? await gamesRes.json() : [];

      const activeSessions = sessions.filter(s => s.isActive);
      const totalPlayers = sessions.reduce((sum, s) => sum + (s.playerCount || 0), 0);

      setStats({
        activeSessions: activeSessions.length,
        totalSessions: sessions.length,
        totalPlayers,
        availableGames: games.filter(g => g.isActive).length
      });

      setRecentSessions(activeSessions.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Sessions',
      value: stats.activeSessions,
      icon: Gamepad2,
      color: 'green',
      description: 'Currently running'
    },
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: Activity,
      color: 'blue',
      description: 'All time'
    },
    {
      title: 'Total Players',
      value: stats.totalPlayers,
      icon: Users,
      color: 'purple',
      description: 'Across all sessions'
    },
    {
      title: 'Available Games',
      value: stats.availableGames,
      icon: Shield,
      color: 'orange',
      description: 'Games you can host'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Welcome, Operator!</h3>
            <p className="text-purple-100">
              Manage your game sessions and track player activity from this control panel.
            </p>
          </div>
          <button
            onClick={() => navigate('/setup')}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-colors"
          >
            <Plus size={20} />
            Create Session
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
            </div>
            <h4 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h4>
            <p className="text-sm font-medium text-slate-700">{stat.title}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Active Sessions</h3>
            <button
              onClick={() => navigate('/operator/sessions')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <Gamepad2 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No active sessions</p>
              <button
                onClick={() => navigate('/setup')}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🎮</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{session.name}</p>
                      <p className="text-sm text-slate-500">{session.gameType?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/game/${session.name}`)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Start Guide</h3>
          
          <div className="space-y-4">
            {[
              { step: 1, title: 'Create a Session', desc: 'Set up a new game session for players' },
              { step: 2, title: 'Add Players', desc: 'Enter player names and starting balances' },
              { step: 3, title: 'Start Recording', desc: 'Record game hands and track scores' },
              { step: 4, title: 'View Settlements', desc: 'See final balances and settlements' }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Create Button */}
      <button
        onClick={() => navigate('/setup')}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default OperatorDashboardOverview;

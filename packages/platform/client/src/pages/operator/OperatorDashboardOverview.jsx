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
      color: 'emerald',
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
      color: 'violet',
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
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Welcome, Operator!</h3>
            <p className="text-violet-100">
              Manage your game sessions and track player activity from this control panel.
            </p>
          </div>
          <button
            onClick={() => navigate('/sessions/new')}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-violet-600 rounded-xl font-bold hover:bg-slate-100 transition-colors"
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
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                stat.color === 'emerald' ? 'bg-emerald-500/10' :
                stat.color === 'blue' ? 'bg-blue-500/10' :
                stat.color === 'violet' ? 'bg-violet-500/10' :
                'bg-orange-500/10'
              }`}>
                <stat.icon size={24} className={`${
                  stat.color === 'emerald' ? 'text-emerald-400' :
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'violet' ? 'text-violet-400' :
                  'text-orange-400'
                }`} />
              </div>
            </div>
            <h4 className="text-2xl font-bold text-slate-50 mb-1">{stat.value}</h4>
            <p className="text-sm font-medium text-slate-300">{stat.title}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-50">Active Sessions</h3>
            <button
              onClick={() => navigate('/operator/sessions')}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium"
            >
              View All
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <Gamepad2 size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No active sessions</p>
              <button
                onClick={() => navigate('/sessions/new')}
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 active:scale-95 bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500"
              >
                Create Your First Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🎮</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{session.name}</p>
                      <p className="text-sm text-slate-400">{session.gameType?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/game/${session.name}`)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 active:scale-95 bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500 text-sm"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Start */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-50 mb-4">Quick Start Guide</h3>
          
          <div className="space-y-4">
            {[
              { step: 1, title: 'Create a Session', desc: 'Set up a new game session for players' },
              { step: 2, title: 'Add Players', desc: 'Enter player names and starting balances' },
              { step: 3, title: 'Start Recording', desc: 'Record game hands and track scores' },
              { step: 4, title: 'View Settlements', desc: 'See final balances and settlements' }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-violet-500/10 text-violet-400 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-slate-200">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Create Button */}
      <button
        onClick={() => navigate('/sessions/new')}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-violet-700 transition-colors"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default OperatorDashboardOverview;

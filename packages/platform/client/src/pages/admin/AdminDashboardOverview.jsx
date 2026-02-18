import React, { useState, useEffect } from 'react';
import { Users, Gamepad2, Activity, TrendingUp, Shield, Clock, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config';

const AdminDashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeOperators: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalGames: 0,
    recentLogins: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch all necessary data
      const [usersRes, sessionsRes, gamesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/sessions`, { credentials: 'include' }),
        fetch(`${API_URL}/api/gametypes`, { credentials: 'include' })
      ]);

      const users = usersRes.ok ? await usersRes.json() : [];
      const sessions = sessionsRes.ok ? await sessionsRes.json() : [];
      const games = gamesRes.ok ? await gamesRes.json() : [];

      setStats({
        totalUsers: users.length,
        activeOperators: users.filter(u => u.role === 'OPERATOR' && u.isActive).length,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
        totalGames: games.filter(g => g.isActive).length,
        recentLogins: users.slice(0, 5) // Last 5 users as example
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      trend: '+12%',
      description: 'Registered accounts'
    },
    {
      title: 'Active Operators',
      value: stats.activeOperators,
      icon: Shield,
      color: 'purple',
      trend: '+5%',
      description: 'Approved operators'
    },
    {
      title: 'Active Sessions',
      value: `${stats.activeSessions}/${stats.totalSessions}`,
      icon: Gamepad2,
      color: 'green',
      trend: 'Live',
      description: 'Currently running'
    },
    {
      title: 'Available Games',
      value: stats.totalGames,
      icon: Activity,
      color: 'orange',
      trend: '+2',
      description: 'Game types'
    }
  ];

  const quickActions = [
    { label: 'Create New User', path: '/admin/users', color: 'bg-blue-500' },
    { label: 'Manage Permissions', path: '/admin/permissions', color: 'bg-purple-500' },
    { label: 'View All Sessions', path: '/admin/games', color: 'bg-green-500' },
    { label: 'Platform Settings', path: '/admin/settings', color: 'bg-orange-500' }
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
        <h3 className="text-2xl font-bold mb-2">Welcome to Admin Control Panel</h3>
        <p className="text-purple-100">
          Manage your platform efficiently. You have full control over users, permissions, games, and system settings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
              <span className={`text-sm font-medium text-${stat.color}-600 bg-${stat.color}-50 px-2 py-1 rounded-full`}>
                {stat.trend}
              </span>
            </div>
            <h4 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h4>
            <p className="text-sm font-medium text-slate-700">{stat.title}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => window.location.href = action.path}
              className={`${action.color} hover:opacity-90 text-white p-4 rounded-xl font-medium transition-opacity text-left`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">System Status</h3>
            <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              All Systems Operational
            </span>
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'Database Connection', status: 'Operational', time: '< 50ms' },
              { name: 'WebSocket Server', status: 'Operational', time: '< 20ms' },
              { name: 'Authentication Service', status: 'Operational', time: '< 30ms' },
              { name: 'Game Engine', status: 'Operational', time: '< 10ms' }
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{service.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{service.time}</span>
                  <span className="text-sm text-green-600 font-medium">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'User Created', user: 'operator_john', time: '2 min ago' },
              { action: 'Session Started', user: 'Game Night #45', time: '15 min ago' },
              { action: 'Permission Updated', user: 'player_sarah', time: '1 hour ago' },
              { action: 'Game Completed', user: 'Teen Patti #12', time: '2 hours ago' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.user}</p>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-yellow-900">System Maintenance Notice</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Scheduled maintenance is planned for this weekend. The platform will be temporarily unavailable 
            for 30 minutes during the update. All active sessions should be completed before then.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;

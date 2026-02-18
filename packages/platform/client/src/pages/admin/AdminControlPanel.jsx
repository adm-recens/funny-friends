import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Settings, Gamepad2, Shield, 
  Bell, LogOut, Menu, X, ChevronRight, Activity,
  UserCog, Key, BarChart3, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminControlPanel = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Verify admin access
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { 
      path: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    { 
      path: '/admin/users', 
      label: 'User Management', 
      icon: Users,
      description: 'Manage all users'
    },
    { 
      path: '/admin/permissions', 
      label: 'Permissions', 
      icon: Shield,
      description: 'Game access control'
    },
    { 
      path: '/admin/games', 
      label: 'Games & Sessions', 
      icon: Gamepad2,
      description: 'Manage game sessions'
    },
    { 
      path: '/admin/settings', 
      label: 'Platform Settings', 
      icon: Settings,
      description: 'System configuration'
    },
    { 
      path: '/admin/monitoring', 
      label: 'Monitoring', 
      icon: Activity,
      description: 'System health & logs'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-72' : 'w-20'} 
          bg-slate-900 text-white transition-all duration-300 flex flex-col
          fixed h-full z-50 lg:relative`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg leading-tight">Admin Panel</h1>
                <p className="text-xs text-slate-400">Control Center</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.username}</p>
                <p className="text-xs text-purple-400">Administrator</p>
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-purple-600 text-white p-1.5 rounded-full shadow-lg hover:bg-purple-700 transition-colors lg:flex hidden"
        >
          {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-slate-600" />
              </button>
              
              <div>
                <h2 className="text-xl font-bold text-slate-900">Administrator Control Panel</h2>
                <p className="text-sm text-slate-500">Manage users, permissions, and platform settings</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell size={20} className="text-slate-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Quick Actions */}
              <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => navigate('/setup')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminControlPanel;

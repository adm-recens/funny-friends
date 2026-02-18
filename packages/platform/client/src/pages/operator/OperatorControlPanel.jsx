import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Gamepad2, Users, Settings, 
  Bell, LogOut, Menu, X, ChevronRight, Activity,
  Shield, BarChart3, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OperatorControlPanel = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'OPERATOR' && user.role !== 'ADMIN')) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { 
      path: '/operator/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Overview & Sessions'
    },
    { 
      path: '/operator/sessions', 
      label: 'My Sessions', 
      icon: Gamepad2,
      description: 'Manage game sessions'
    },
    { 
      path: '/operator/games', 
      label: 'Available Games', 
      icon: Gamepad2,
      description: 'Games you can host'
    },
    { 
      path: '/operator/profile', 
      label: 'My Profile', 
      icon: Settings,
      description: 'Account settings'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col fixed h-full z-50 lg:relative`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gamepad2 size={20} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-50">Operator Panel</h1>
                <p className="text-xs text-slate-400">Session Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
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
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-200 truncate">{user?.username}</p>
                <p className="text-xs text-violet-400">Operator</p>
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-violet-600 text-white p-1.5 rounded-full shadow-lg hover:bg-violet-700 transition-colors lg:flex hidden"
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
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-slate-400" />
              </button>
              
              <div>
                <h2 className="text-xl font-bold text-slate-50">Operator Control Panel</h2>
                <p className="text-sm text-slate-400">Manage your game sessions and players</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/sessions/new')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 active:scale-95 bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500 text-sm"
              >
                Create New Session
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OperatorControlPanel;

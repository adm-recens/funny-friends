import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, User, History, Settings, Users, Eye, Shield, LogIn, Gamepad2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DebugFooter from '../components/DebugFooter';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://teen-patti-app.onrender.com';

const Welcome = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [activeGames, setActiveGames] = useState([]);
    const [viewMode, setViewMode] = useState(null);
    
    // Operator login state
    const [operatorCredentials, setOperatorCredentials] = useState({ username: '', password: '' });
    const [operatorError, setOperatorError] = useState('');
    const [operatorLoading, setOperatorLoading] = useState(false);
    
    // Viewer login state
    const [viewerCredentials, setViewerCredentials] = useState({ name: '', sessionName: '' });
    const [viewerError, setViewerError] = useState('');
    const [viewerLoading, setViewerLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/sessions/active`)
            .then(res => res.json())
            .then(data => setActiveGames(data))
            .catch(err => console.error("Failed to fetch active games", err));
    }, []);

    const handleOperatorLogin = async (e) => {
        e.preventDefault();
        setOperatorError('');
        setOperatorLoading(true);
        
        try {
            const result = await login(operatorCredentials.username, operatorCredentials.password);
            if (result.success) {
                if (result.user.role === 'OPERATOR' || result.user.role === 'ADMIN') {
                    navigate('/operator-dashboard');
                } else {
                    setOperatorError('You do not have operator access');
                }
            } else {
                setOperatorError(result.error || 'Login failed');
            }
        } catch (e) {
            setOperatorError('Error logging in');
        } finally {
            setOperatorLoading(false);
        }
    };

    const handleViewerJoin = async (e) => {
        e.preventDefault();
        setViewerError('');
        setViewerLoading(true);
        
        try {
            const res = await fetch(`${API_URL}/api/sessions/active`);
            const activeSessions = await res.json();
            
            const session = activeSessions.find(s => s.name.toLowerCase() === viewerCredentials.sessionName.toLowerCase());
            
            if (!session) {
                setViewerError('Game session not found or has ended');
                setViewerLoading(false);
                return;
            }
            
            navigate(`/viewer/${viewerCredentials.sessionName}`, {
                state: { viewerName: viewerCredentials.name }
            });
        } catch (e) {
            setViewerError('Error connecting to server');
        } finally {
            setViewerLoading(false);
        }
    };

    if (viewMode === 'operator') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black opacity-60"></div>
                
                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <Users className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">Operator Login</h1>
                        <p className="text-slate-500 mt-2">Enter your credentials to manage games</p>
                    </div>
                    
                    <form onSubmit={handleOperatorLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={operatorCredentials.username}
                                onChange={(e) => setOperatorCredentials({ ...operatorCredentials, username: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-purple-500 outline-none transition-all"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={operatorCredentials.password}
                                onChange={(e) => setOperatorCredentials({ ...operatorCredentials, password: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-purple-500 outline-none transition-all"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        
                        {operatorError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                {operatorError}
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={operatorLoading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
                        >
                            {operatorLoading ? 'Logging in...' : 'Login'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setViewMode(null)}
                            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600"
                        >
                            Back
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (viewMode === 'viewer') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900 via-slate-900 to-black opacity-60"></div>
                
                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <Eye className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">Watch Game</h1>
                        <p className="text-slate-500 mt-2">Enter your details to watch a live game</p>
                    </div>
                    
                    <form onSubmit={handleViewerJoin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                            <input
                                type="text"
                                value={viewerCredentials.name}
                                onChange={(e) => setViewerCredentials({ ...viewerCredentials, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Game Name</label>
                            <input
                                type="text"
                                value={viewerCredentials.sessionName}
                                onChange={(e) => setViewerCredentials({ ...viewerCredentials, sessionName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Enter game name"
                                required
                            />
                        </div>
                        
                        {viewerError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                {viewerError}
                            </div>
                        )}
                        
                        <button
                            type="submit"
                            disabled={viewerLoading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                        >
                            {viewerLoading ? 'Connecting...' : 'Watch Game'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setViewMode(null)}
                            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600"
                        >
                            Back
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Heart size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                Funny <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Friends</span>
                            </h1>
                            <p className="text-sm text-slate-400">Play games with friends, securely and for fun!</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {user?.role === 'ADMIN' && (
                            <button onClick={() => navigate('/admin')} className="text-slate-500 hover:text-white transition-colors">
                                <Settings />
                            </button>
                        )}
                        
                        {user && (
                            <button
                                onClick={() => navigate('/logout')}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-all text-sm"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>

                {/* Platform Description */}
                {!user && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-6">
                            <Sparkles size={16} className="text-purple-400" />
                            <span className="text-purple-300 text-sm font-medium">Currently Playing: Teen Patti</span>
                        </div>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            A platform where friends gather to play card games together. 
                            More games coming soon!
                        </p>
                    </div>
                )}

                {/* Role Selection */}
                {!user && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {/* Operator Card */}
                        <button 
                            onClick={() => setViewMode('operator')}
                            className="group bg-gradient-to-br from-purple-900/50 to-purple-800/30 hover:from-purple-800/50 hover:to-purple-700/30 border border-purple-500/30 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                <Users className="text-white" size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Operator</h3>
                            <p className="text-purple-200 mb-4">Create and manage game sessions for your friends</p>
                            <div className="flex items-center gap-2 text-purple-400 font-bold group-hover:gap-4 transition-all">
                                Login <ArrowRight size={18} />
                            </div>
                        </button>

                        {/* Viewer Card */}
                        <button 
                            onClick={() => setViewMode('viewer')}
                            className="group bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 hover:from-emerald-800/50 hover:to-emerald-700/30 border border-emerald-500/30 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                <Eye className="text-white" size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Viewer</h3>
                            <p className="text-emerald-200 mb-4">Watch live games in real-time</p>
                            <div className="flex items-center gap-2 text-emerald-400 font-bold group-hover:gap-4 transition-all">
                                Watch Game <ArrowRight size={18} />
                            </div>
                        </button>

                        {/* Admin Card */}
                        <button 
                            onClick={() => navigate('/login')}
                            className="group bg-gradient-to-br from-slate-800/50 to-slate-700/30 hover:from-slate-700/50 hover:to-slate-600/30 border border-slate-500/30 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Shield className="text-white" size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Admin</h3>
                            <p className="text-slate-300 mb-4">Full system administration access</p>
                            <div className="flex items-center gap-2 text-slate-400 font-bold group-hover:gap-4 transition-all">
                                Login <ArrowRight size={18} />
                            </div>
                        </button>
                    </div>
                )}

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                        {user?.role === 'OPERATOR' ? 'Your Games' : 'Active Games'}
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        {user?.role === 'OPERATOR' 
                            ? 'Manage your active game sessions.' 
                            : 'Join an active Teen Patti table or start your own session.'}
                    </p>
                </div>

                {/* Grid View */}
                {activeGames.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Gamepad2 size={32} className="text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Active Games</h3>
                        <p className="text-slate-400 mb-8">There are no games running right now.</p>
                        {user?.role === 'OPERATOR' && (
                            <button
                                onClick={() => navigate('/setup')}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-purple-500/20 hover:scale-105 transition-all"
                            >
                                Start a New Game
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeGames.map((game) => (
                            <div
                                key={game.name}
                                onClick={() => navigate(`/game/${game.name}`)}
                                className="group bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <Heart size={24} />
                                    </div>
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        LIVE
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
                                        Teen Patti
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-400 text-sm">
                                    <span className="flex items-center gap-1"><User size={14} /> {game.playerCount} Players</span>
                                    <span className="flex items-center gap-1"><History size={14} /> Round {game.currentRound}/{game.totalRounds}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <DebugFooter />
        </div>
    );
};

export default Welcome;

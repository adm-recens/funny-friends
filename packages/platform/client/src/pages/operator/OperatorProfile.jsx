import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Save, Key, Eye, EyeOff, 
  CheckCircle, AlertCircle, Gamepad2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

const OperatorProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        username: user.username,
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: profile.email,
          currentPassword: profile.currentPassword || undefined,
          newPassword: profile.newPassword || undefined
        })
      });

      if (res.ok) {
        showNotification('Profile updated successfully', 'success');
        setProfile(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await res.json();
        showNotification(error.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showNotification('Error updating profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
        <p className="text-slate-500">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Avatar Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-purple-600">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="text-white">
              <h3 className="text-2xl font-bold">{user?.username}</h3>
              <p className="text-purple-100 flex items-center gap-2">
                <Shield size={16} />
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          {/* Username (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Password Change */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Key size={18} />
              Change Password
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={profile.currentPassword}
                    onChange={(e) => setProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={profile.newPassword}
                    onChange={(e) => setProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={profile.confirmPassword}
                    onChange={(e) => setProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Game Permissions */}
          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
              <Gamepad2 size={18} />
              Your Game Permissions
            </h4>

            <div className="flex flex-wrap gap-2">
              {user?.allowedGames?.length > 0 ? (
                user.allowedGames.map((gameId) => (
                  <span 
                    key={gameId}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {gameId}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No specific game permissions assigned</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default OperatorProfile;

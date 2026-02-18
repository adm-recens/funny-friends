import React, { useState } from 'react';
import { 
  Settings, Save, Database, Bell, Shield, Key, 
  Server, RefreshCw, CheckCircle, AlertTriangle, Eye, EyeOff
} from 'lucide-react';

const PlatformSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'Funny Friends',
    allowGuestLogin: true,
    requireEmailVerification: false,
    maxSessionsPerUser: 5,
    sessionTimeoutMinutes: 120,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    passwordMinLength: 8,
    jwtExpirationHours: 8,
    requirePasswordChange: false,
    emailNotifications: false,
    sessionAlerts: true,
    userRegistrationAlerts: true,
    backupEnabled: true,
    backupFrequency: 'daily',
    dataRetentionDays: 90
  });

  const [showSaveNotification, setShowSaveNotification] = useState(false);

  const handleSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  const settingSections = [
    {
      title: 'Platform General',
      icon: Settings,
      settings: [
        { key: 'platformName', label: 'Platform Name', type: 'text', description: 'Name of your gaming platform' },
        { key: 'allowGuestLogin', label: 'Allow Guest Login', type: 'toggle', description: 'Allow users to play without registering' },
        { key: 'requireEmailVerification', label: 'Require Email Verification', type: 'toggle', description: 'Users must verify email before playing' },
        { key: 'maxSessionsPerUser', label: 'Max Concurrent Sessions', type: 'number', description: 'Maximum sessions a user can participate in' },
        { key: 'sessionTimeoutMinutes', label: 'Session Timeout (minutes)', type: 'number', description: 'Auto-logout after inactivity' },
      ]
    },
    {
      title: 'Security',
      icon: Shield,
      settings: [
        { key: 'maxLoginAttempts', label: 'Max Login Attempts', type: 'number', description: 'Failed attempts before lockout' },
        { key: 'lockoutDurationMinutes', label: 'Lockout Duration (minutes)', type: 'number', description: 'How long account is locked' },
        { key: 'passwordMinLength', label: 'Minimum Password Length', type: 'number', description: 'Minimum characters required' },
        { key: 'jwtExpirationHours', label: 'JWT Token Expiration (hours)', type: 'number', description: 'How long sessions last' },
        { key: 'requirePasswordChange', label: 'Force Password Change', type: 'toggle', description: 'Require password change on first login' },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        { key: 'emailNotifications', label: 'Email Notifications', type: 'toggle', description: 'Send email alerts for important events' },
        { key: 'sessionAlerts', label: 'Session Alerts', type: 'toggle', description: 'Notify when sessions start/end' },
        { key: 'userRegistrationAlerts', label: 'New User Alerts', type: 'toggle', description: 'Notify when new users register' },
      ]
    },
    {
      title: 'Data Management',
      icon: Database,
      settings: [
        { key: 'backupEnabled', label: 'Enable Automatic Backups', type: 'toggle', description: 'Schedule regular database backups' },
        { key: 'backupFrequency', label: 'Backup Frequency', type: 'select', options: ['hourly', 'daily', 'weekly'], description: 'How often to backup database' },
        { key: 'dataRetentionDays', label: 'Data Retention (days)', type: 'number', description: 'How long to keep historical data' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-slate-500">Configure platform behavior and security settings</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>

      {settingSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <section.icon size={20} className="text-purple-600" />
              {section.title}
            </h3>
          </div>

          <div className="divide-y divide-slate-200">
            {section.settings.map((setting, settingIndex) => (
              <div key={settingIndex} className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <label className="font-medium text-slate-900">{setting.label}</label>
                  <p className="text-sm text-slate-500 mt-1">{setting.description}</p>
                </div>

                <div className="w-64">
                  {setting.type === 'toggle' && (
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        settings[setting.key] ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        settings[setting.key] ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  )}

                  {setting.type === 'text' && (
                    <input
                      type="text"
                      value={settings[setting.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  )}

                  {setting.type === 'number' && (
                    <input
                      type="number"
                      value={settings[setting.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  )}

                  {setting.type === 'select' && (
                    <select
                      value={settings[setting.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {setting.options.map(opt => (
                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-red-200">
          <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h3>
          <p className="text-sm text-red-700 mt-1">Irreversible actions - proceed with caution</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Reset All Data</p>
              <p className="text-sm text-slate-500">Delete all users, sessions, and game data. Cannot be undone.</p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {showSaveNotification && (
        <div className="fixed bottom-4 right-4 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle size={20} />
          Settings saved successfully!
        </div>
      )}
    </div>
  );
};

export default PlatformSettings;

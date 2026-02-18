import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { API_URL } from './config';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Setup from './pages/Setup';
import Profile from './pages/Profile';
import SessionSetup from './pages/SessionSetup';
import Help from './pages/Help';

// Admin Control Panel
import AdminControlPanel from './pages/admin/AdminControlPanel';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview';
import UserManagement from './pages/admin/UserManagement';
import PermissionsManagement from './pages/admin/PermissionsManagement';
import PlatformSettings from './pages/admin/PlatformSettings';

// Operator Control Panel
import OperatorControlPanel from './pages/operator/OperatorControlPanel';
import OperatorDashboardOverview from './pages/operator/OperatorDashboardOverview';
import OperatorSessions from './pages/operator/OperatorSessions';
import OperatorGames from './pages/operator/OperatorGames';
import OperatorProfile from './pages/operator/OperatorProfile';

// Setup Check Component
const SetupCheck = ({ children }) => {
  const [needsSetup, setNeedsSetup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch(`${API_URL}/api/setup/status`);
        const data = await res.json();
        setNeedsSetup(data.needsSetup);
      } catch (e) {
        console.error('Failed to check setup status:', e);
        setNeedsSetup(false);
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (needsSetup) {
    return <Navigate to="/system-setup" replace />;
  }

  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children, requireOperator = false, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (requireOperator && user.role !== 'OPERATOR' && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/system-setup" element={<Setup />} />
      <Route path="/" element={
        <SetupCheck>
          <Welcome />
        </SetupCheck>
      } />
      <Route path="/login" element={
        <SetupCheck>
          <Login />
        </SetupCheck>
      } />
      <Route path="/logout" element={<Logout />} />
      <Route path="/help" element={<Help />} />
      
      {/* Admin Control Panel Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminControlPanel />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="permissions" element={<PermissionsManagement />} />
        <Route path="games" element={<AdminDashboardOverview />} />
        <Route path="settings" element={<PlatformSettings />} />
        <Route path="monitoring" element={<AdminDashboardOverview />} />
      </Route>

      {/* Legacy Admin Route - Redirect to new control panel */}
      <Route path="/admin-old" element={<Navigate to="/admin/dashboard" replace />} />
      
      {/* Operator Control Panel Routes */}
      <Route
        path="/operator"
        element={
          <ProtectedRoute requireOperator={true}>
            <OperatorControlPanel />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/operator/dashboard" replace />} />
        <Route path="dashboard" element={<OperatorDashboardOverview />} />
        <Route path="sessions" element={<OperatorSessions />} />
        <Route path="games" element={<OperatorGames />} />
        <Route path="profile" element={<OperatorProfile />} />
      </Route>

      {/* Legacy Operator Dashboard - Redirect to new control panel */}
      <Route path="/operator-dashboard" element={<Navigate to="/operator/dashboard" replace />} />
      
      {/* Session Setup - Create new game session */}
      <Route
        path="/sessions/new"
        element={
          <ProtectedRoute requireOperator={true}>
            <SessionSetup />
          </ProtectedRoute>
        }
      />
      
      {/* Profile Route - Any logged in user */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

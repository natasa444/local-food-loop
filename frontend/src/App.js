import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import ConsumerDashboard from './pages/ConsumerDashboard';
import Subscriptions from './pages/Subscriptions';
import Deliveries from './pages/Deliveries';
import Customizations from './pages/Customizations';
import BrowseProduce from './pages/BrowseProduce';
import Notifications from './pages/Notifications';
import FarmerDashboard from './pages/FarmerDashboard';
import FarmerInventory from './pages/FarmerInventory';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDeliveries from './pages/AdminDeliveries';
import AdminManifests from './pages/AdminManifests';
import AdminCustomizations from './pages/AdminCustomizations';
import './index.css';

function ProtectedLayout({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Consumer routes */}
          <Route path="/dashboard" element={<ProtectedLayout allowedRoles={['consumer']}><ConsumerDashboard /></ProtectedLayout>} />
          <Route path="/subscriptions" element={<ProtectedLayout allowedRoles={['consumer']}><Subscriptions /></ProtectedLayout>} />
          <Route path="/deliveries" element={<ProtectedLayout allowedRoles={['consumer']}><Deliveries /></ProtectedLayout>} />
          <Route path="/customizations" element={<ProtectedLayout allowedRoles={['consumer']}><Customizations /></ProtectedLayout>} />
          <Route path="/produce" element={<ProtectedLayout allowedRoles={['consumer']}><BrowseProduce /></ProtectedLayout>} />

          {/* Farmer routes */}
          <Route path="/farmer" element={<ProtectedLayout allowedRoles={['farmer']}><FarmerDashboard /></ProtectedLayout>} />
          <Route path="/farmer/inventory" element={<ProtectedLayout allowedRoles={['farmer']}><FarmerInventory /></ProtectedLayout>} />

          {/* Shared routes */}
          <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedLayout allowedRoles={['admin']}><AdminDashboard /></ProtectedLayout>} />
          <Route path="/admin/users" element={<ProtectedLayout allowedRoles={['admin']}><AdminUsers /></ProtectedLayout>} />
          <Route path="/admin/deliveries" element={<ProtectedLayout allowedRoles={['admin']}><AdminDeliveries /></ProtectedLayout>} />
          <Route path="/admin/manifests" element={<ProtectedLayout allowedRoles={['admin']}><AdminManifests /></ProtectedLayout>} />
          <Route path="/admin/customizations" element={<ProtectedLayout allowedRoles={['admin']}><AdminCustomizations /></ProtectedLayout>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
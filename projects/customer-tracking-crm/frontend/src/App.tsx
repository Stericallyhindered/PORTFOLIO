import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPanelPage from './pages/AdminPanelPage';
import CompaniesPage from './pages/CompaniesPage';
import ContactsPage from './pages/ContactsPage';
import OrdersPage from './pages/OrdersPage';
import CustomerPortalPage from './pages/CustomerPortalPage';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'sales' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/portal/:token" element={<CustomerPortalPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanelPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <AppRoutes />
            </div>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Users, 
  Package, 
  Settings, 
  Bell, 
  LogOut, 
  Menu,
  X,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { state: authState, logout } = useAuth();
  const { state: notificationState, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: location.pathname === '/dashboard' },
    { name: 'Companies', href: '/companies', icon: Building2, current: location.pathname === '/companies' },
    { name: 'Contacts', href: '/contacts', icon: Users, current: location.pathname === '/contacts' },
    { name: 'Orders', href: '/orders', icon: Package, current: location.pathname === '/orders' },
    ...(authState.user?.role === 'admin' ? [
      { name: 'Admin Panel', href: '/admin', icon: Shield, current: location.pathname === '/admin' }
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setNotificationOpen(false);
    
    // Navigate to relevant page based on entity type
    if (notification.entity_type === 'company') {
      navigate('/companies');
    } else if (notification.entity_type === 'contact') {
      navigate('/contacts');
    } else if (notification.entity_type === 'order') {
      navigate('/orders');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kraken-black to-kraken-dark">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-kraken-dark border-r border-glass-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-glass-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-kraken-red to-kraken-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <h1 className="text-xl font-bold text-white">Kraken Marine</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-kraken-gray hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-kraken-red text-white shadow-lg'
                      : 'text-kraken-gray hover:bg-glass-bg hover:text-white'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-glass-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-kraken-red to-kraken-orange rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {authState.user?.first_name} {authState.user?.last_name}
              </p>
              <p className="text-xs text-kraken-gray truncate">
                {authState.user?.role === 'admin' ? 'Administrator' : 'Sales Agent'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-kraken-gray hover:text-white hover:bg-glass-bg rounded-lg transition-colors"
          >
            <LogOut size={16} className="mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-kraken-dark/80 backdrop-blur-lg border-b border-glass-border">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-kraken-gray hover:text-white"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 text-kraken-gray hover:text-white hover:bg-glass-bg rounded-lg transition-colors"
                >
                  <Bell size={20} />
                  {notificationState.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-kraken-red text-white text-xs rounded-full flex items-center justify-center">
                      {notificationState.unreadCount > 9 ? '9+' : notificationState.unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-kraken-dark border border-glass-border rounded-xl shadow-xl z-50">
                    <div className="p-4 border-b border-glass-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        {notificationState.unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-kraken-red hover:text-kraken-red-hover"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notificationState.notifications.length === 0 ? (
                        <div className="p-4 text-center text-kraken-gray">
                          No notifications
                        </div>
                      ) : (
                        notificationState.notifications.slice(0, 10).map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full p-4 text-left border-b border-glass-border hover:bg-glass-bg transition-colors ${
                              !notification.is_read ? 'bg-kraken-red/10' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.is_read ? 'bg-kraken-red' : 'bg-transparent'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-kraken-gray mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-kraken-gray-dark mt-2">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {authState.user?.first_name} {authState.user?.last_name}
                  </p>
                  <p className="text-xs text-kraken-gray">
                    {authState.user?.role === 'admin' ? 'Administrator' : 'Sales Agent'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-kraken-red to-kraken-orange rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

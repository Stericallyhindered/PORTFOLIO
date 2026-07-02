import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Building2, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import apiClient from '../utils/api';
import { Company, Contact, Order, DashboardStats } from '../types';

const DashboardPage: React.FC = () => {
  const { state: authState } = useAuth();
  const { isConnected } = useSocket();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingApprovals: 0,
    totalCompanies: 0,
    totalContacts: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load orders, companies, and contacts
      const [orders, companies, contacts, approvals] = await Promise.all([
        apiClient.getOrders({ limit: 5 }),
        apiClient.getCompanies({ limit: 5 }),
        apiClient.getContacts({ limit: 5 }),
        authState.user?.role === 'admin' ? apiClient.getApprovals('submitted') : Promise.resolve([])
      ]);

      setRecentOrders(orders);
      setRecentCompanies(companies);
      
      // Calculate stats
      const totalOrders = orders.length;
      const totalCompanies = companies.length;
      const totalContacts = contacts.length;
      const pendingApprovals = approvals.length;
      const monthlyRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setStats({
        totalOrders,
        pendingApprovals,
        totalCompanies,
        totalContacts,
        monthlyRevenue,
        activeUsers: 1, // This would come from a real API
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      case 'submitted': return 'badge-info';
      default: return 'badge-gray';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'badge-success';
      case 'shipped': return 'badge-info';
      case 'production': return 'badge-warning';
      case 'confirmed': return 'badge-success';
      case 'draft': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {authState.user?.first_name}!
          </h1>
          <p className="text-kraken-gray mt-2">
            Here's what's happening with your marine battery operations today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'} animate-pulse`}></div>
          <span className="text-sm text-kraken-gray">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-kraken-gray text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-kraken-red to-kraken-red-hover rounded-xl flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-kraken-gray text-sm">Companies</p>
              <p className="text-3xl font-bold text-white">{stats.totalCompanies}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-kraken-orange to-kraken-orange-hover rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-kraken-gray text-sm">Contacts</p>
              <p className="text-3xl font-bold text-white">{stats.totalContacts}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-kraken-red to-kraken-red-hover rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
          </div>
        </div>

        {authState.user?.role === 'admin' && (
          <div className="card hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-kraken-gray text-sm">Pending Approvals</p>
                <p className="text-3xl font-bold text-white">{stats.pendingApprovals}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-kraken-orange to-kraken-orange-hover rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-subtitle">Common tasks and shortcuts</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-primary">
            <Plus size={20} />
            New Order
          </button>
          <button className="btn btn-secondary">
            <Building2 size={20} />
            Add Company
          </button>
          <button className="btn btn-secondary">
            <Users size={20} />
            Add Contact
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
            <p className="card-subtitle">Latest order activity</p>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-kraken-gray">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
                <p className="text-sm">Create your first order to get started</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-glass-bg rounded-lg border border-glass-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-kraken-red to-kraken-red-hover rounded-lg flex items-center justify-center">
                      <Package size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{order.order_number}</p>
                      <p className="text-sm text-kraken-gray">
                        {order.company_name || `${order.first_name} ${order.last_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-sm text-kraken-gray mt-1">
                      ${order.total_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Companies</h3>
            <p className="card-subtitle">Latest company additions</p>
          </div>
          <div className="space-y-4">
            {recentCompanies.length === 0 ? (
              <div className="text-center py-8 text-kraken-gray">
                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>No companies yet</p>
                <p className="text-sm">Add your first company to get started</p>
              </div>
            ) : (
              recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 bg-glass-bg rounded-lg border border-glass-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-kraken-orange to-kraken-orange-hover rounded-lg flex items-center justify-center">
                      <Building2 size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{company.name}</p>
                      <p className="text-sm text-kraken-gray">{company.industry || 'No industry'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getStatusColor(company.approval_status)}`}>
                      {company.approval_status}
                    </span>
                    <p className="text-sm text-kraken-gray mt-1">
                      {company.city}, {company.state}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">System Status</h3>
          <p className="card-subtitle">Real-time system monitoring</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <div>
              <p className="text-white font-medium">Database</p>
              <p className="text-sm text-kraken-gray">Connected</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 ${isConnected ? 'bg-success' : 'bg-error'} rounded-full animate-pulse`}></div>
            <div>
              <p className="text-white font-medium">WebSocket</p>
              <p className="text-sm text-kraken-gray">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <div>
              <p className="text-white font-medium">API</p>
              <p className="text-sm text-kraken-gray">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

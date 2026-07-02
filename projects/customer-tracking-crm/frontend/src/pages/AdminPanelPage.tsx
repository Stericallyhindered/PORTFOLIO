import React from 'react';
import { Shield, Users, BarChart3, Settings, CheckCircle, Clock } from 'lucide-react';

const AdminPanelPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-kraken-gray mt-2">System administration and management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield size={24} className="text-kraken-red" />
          <span className="text-kraken-gray">Administrator Access</span>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-kraken-gray text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white">12</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-kraken-red to-kraken-red-hover rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-kraken-gray text-sm">Pending Approvals</p>
              <p className="text-3xl font-bold text-white">5</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-kraken-orange to-kraken-orange-hover rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-kraken-gray text-sm">Approved Today</p>
              <p className="text-3xl font-bold text-white">8</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-success to-success rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-kraken-gray text-sm">System Health</p>
              <p className="text-3xl font-bold text-white">98%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-kraken-red to-kraken-red-hover rounded-xl flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Management</h3>
            <p className="card-subtitle">Manage system users and permissions</p>
          </div>
          <div className="space-y-4">
            <button className="w-full btn btn-secondary text-left">
              <Users size={20} />
              View All Users
            </button>
            <button className="w-full btn btn-secondary text-left">
              <Users size={20} />
              Create New User
            </button>
            <button className="w-full btn btn-secondary text-left">
              <Settings size={20} />
              User Permissions
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Approval Queue</h3>
            <p className="card-subtitle">Review pending approvals</p>
          </div>
          <div className="space-y-4">
            <button className="w-full btn btn-secondary text-left">
              <Clock size={20} />
              Pending Orders (3)
            </button>
            <button className="w-full btn btn-secondary text-left">
              <Clock size={20} />
              Pending Companies (2)
            </button>
            <button className="w-full btn btn-secondary text-left">
              <Clock size={20} />
              Pending Contacts (1)
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12 text-kraken-gray">
          <Shield size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Admin Panel</h3>
          <p>This page will contain the full admin management interface</p>
          <p className="text-sm mt-2">Features: User management, approvals, analytics, system settings</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;

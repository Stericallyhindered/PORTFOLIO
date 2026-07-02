import React from 'react';
import { Building2, Plus, Search, Filter } from 'lucide-react';

const CompaniesPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Companies</h1>
          <p className="text-kraken-gray mt-2">Manage your company database</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={20} />
          Add Company
        </button>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kraken-gray" />
            <input
              type="text"
              placeholder="Search companies..."
              className="form-input pl-10"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter size={20} />
            Filter
          </button>
        </div>

        <div className="text-center py-12 text-kraken-gray">
          <Building2 size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Companies Management</h3>
          <p>This page will contain the full companies management interface</p>
          <p className="text-sm mt-2">Features: Add, edit, approve, and track companies</p>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;

import React from 'react';
import { Package, Truck, FileText, Clock } from 'lucide-react';

const CustomerPortalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-kraken-black to-kraken-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card animate-fade-in">
          <div className="text-center py-12">
            <Package size={64} className="mx-auto mb-4 text-kraken-red" />
            <h1 className="text-3xl font-bold text-white mb-4">Customer Portal</h1>
            <p className="text-kraken-gray mb-8">
              Track your marine battery orders in real-time
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-kraken-red to-kraken-red-hover rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Order Tracking</h3>
                <p className="text-sm text-kraken-gray">Real-time order status updates</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-kraken-orange to-kraken-orange-hover rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Truck size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Shipping Updates</h3>
                <p className="text-sm text-kraken-gray">Track vessel and delivery status</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-kraken-red to-kraken-red-hover rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Documents</h3>
                <p className="text-sm text-kraken-gray">Access order documents and certificates</p>
              </div>
            </div>
            
            <div className="text-center text-kraken-gray">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Customer Portal</h3>
              <p>This page will contain the full customer portal interface</p>
              <p className="text-sm mt-2">Features: Order tracking, shipping updates, document access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalPage;

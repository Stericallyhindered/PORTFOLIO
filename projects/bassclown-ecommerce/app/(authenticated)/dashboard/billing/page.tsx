import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SubscriptionOverview } from '@/components/dashboard/SubscriptionOverview';
import { BillingHistory } from '@/components/dashboard/BillingHistory';
import { PaymentMethods } from '@/components/dashboard/PaymentMethods';

export const metadata: Metadata = {
  title: 'Billing - Bass Clown Co Dashboard',
  description: 'Manage your subscription and billing information.',
};

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscription Overview */}
          <div className="lg:col-span-2">
            <SubscriptionOverview />
          </div>
          
          {/* Payment Methods */}
          <div>
            <PaymentMethods />
          </div>
        </div>
        
        {/* Billing History */}
        <BillingHistory />
      </div>
    </DashboardLayout>
  );
} 
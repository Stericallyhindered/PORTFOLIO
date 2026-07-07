import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ContestStatus } from '@/components/dashboard/ContestStatus';
import { BrandDashboardStats } from '@/components/brand/BrandDashboardStats';

export const metadata: Metadata = {
  title: 'Brand Dashboard - Bass Clown Co',
  description: 'Brand dashboard for managing contests, campaigns, and content.',
};

export default function BrandDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Brand Dashboard Overview */}
        <BrandDashboardStats />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <RecentProjects />
          </div>
        </div>
        
        {/* Contest Status */}
        <ContestStatus />
      </div>
    </DashboardLayout>
  );
} 
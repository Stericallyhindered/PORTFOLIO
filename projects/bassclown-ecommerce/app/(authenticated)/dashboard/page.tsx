import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ContestStatus } from '@/components/dashboard/ContestStatus';

export const metadata: Metadata = {
  title: 'Dashboard - Bass Clown Co',
  description: 'Your personal dashboard for managing projects, contests, and video content.',
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Dashboard Overview */}
        <DashboardOverview />
        
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
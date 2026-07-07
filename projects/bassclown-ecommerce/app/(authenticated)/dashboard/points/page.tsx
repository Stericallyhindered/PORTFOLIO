import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PointsOverview } from '@/components/dashboard/PointsOverview';
import { PointsHistory } from '@/components/dashboard/PointsHistory';
import { PointsRewards } from '@/components/dashboard/PointsRewards';

export const metadata: Metadata = {
  title: 'Points - Bass Clown Co Dashboard',
  description: 'View your points balance, history, and available rewards.',
};

export default function PointsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Points & Rewards</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Points Overview */}
          <div className="lg:col-span-2">
            <PointsOverview />
          </div>
          
          {/* Points Rewards */}
          <div>
            <PointsRewards />
          </div>
        </div>
        
        {/* Points History */}
        <PointsHistory />
      </div>
    </DashboardLayout>
  );
} 
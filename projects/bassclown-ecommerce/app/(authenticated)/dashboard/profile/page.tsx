import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ProfileForm } from '@/components/dashboard/ProfileForm';
import { ProfileStats } from '@/components/dashboard/ProfileStats';

export const metadata: Metadata = {
  title: 'Profile - Bass Clown Co Dashboard',
  description: 'Manage your profile and account settings.',
};

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Stats */}
          <div className="lg:col-span-1">
            <ProfileStats />
          </div>
          
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <ProfileForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
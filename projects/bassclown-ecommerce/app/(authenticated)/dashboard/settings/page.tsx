import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AccountSettings } from '@/components/dashboard/AccountSettings';
import { NotificationSettings } from '@/components/dashboard/NotificationSettings';
import { PrivacySettings } from '@/components/dashboard/PrivacySettings';

export const metadata: Metadata = {
  title: 'Settings - Bass Clown Co Dashboard',
  description: 'Manage your account settings and preferences.',
};

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Settings */}
          <div className="space-y-6">
            <AccountSettings />
            <PrivacySettings />
          </div>
          
          {/* Notification Settings */}
          <div>
            <NotificationSettings />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
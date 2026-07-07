import { Metadata } from 'next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import DropboxSyncPanel from '@/components/dropbox/DropboxSyncPanel';

export const metadata: Metadata = {
  title: 'Dropbox Sync - Bass Clown Co.',
  description: 'Manage your Dropbox file synchronization settings'
};

export default function DropboxSyncPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dropbox Sync</h1>
          <p className="text-gray-400">
            Sync your contest submissions and media files with Dropbox for backup and easy access.
          </p>
        </div>

        <DropboxSyncPanel />
      </div>
    </DashboardLayout>
  );
} 
import { Metadata } from 'next';
import ReportsPanel from '@/components/admin/ReportsPanel';

export const metadata: Metadata = {
  title: 'Reports - Bass Clown Co. Admin',
  description: 'Generate comprehensive analytics reports for platform insights'
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Generate comprehensive reports and analyze platform performance metrics.
        </p>
      </div>

      <ReportsPanel />
    </div>
  );
} 
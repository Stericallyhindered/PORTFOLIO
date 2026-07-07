import { AdminAuthGuard } from '@/components/AdminAuthGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AuthProvider } from '@/lib/auth-context';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminAuthGuard>
        <AdminLayout>
          {children}
        </AdminLayout>
      </AdminAuthGuard>
    </AuthProvider>
  );
} 
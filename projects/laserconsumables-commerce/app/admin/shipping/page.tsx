import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import ShippingDashboard from '@/components/admin/ShippingDashboard'

export default async function ShippingPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <ShippingDashboard initialTab={searchParams.tab || 'overview'} />
    </div>
  )
}

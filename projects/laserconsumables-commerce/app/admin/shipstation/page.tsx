import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ShippingDashboard from '@/components/admin/ShippingDashboard'

export default async function ShipStationPage({
  searchParams,
}: {
  searchParams: { tab?: string; orderId?: string; shipmentId?: string }
}) {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <ShippingDashboard initialTab={searchParams.tab || 'overview'} />
    </div>
  )
}


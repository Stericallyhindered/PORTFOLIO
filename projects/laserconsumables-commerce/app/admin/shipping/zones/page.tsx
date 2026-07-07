import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getShippingZones, getShippingProfiles } from '@/lib/services/shipping-advanced'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ShippingZoneManager from '@/components/admin/ShippingZoneManager'

export default async function AdminShippingZonesPage() {
  await requireAdmin()

  const [zones, profiles] = await Promise.all([getShippingZones(), getShippingProfiles()])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shipping Zones & Profiles</h1>
        <Link href="/admin/shipping">
          <Button variant="outline">Back to Shipping</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Zones</CardTitle>
            <CardDescription>Define shipping zones with rate rules</CardDescription>
          </CardHeader>
          <CardContent>
            <ShippingZoneManager zones={zones} profiles={profiles} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



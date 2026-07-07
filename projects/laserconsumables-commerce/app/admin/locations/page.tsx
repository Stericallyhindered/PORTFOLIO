import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getLocations } from '@/lib/services/inventory-advanced'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import LocationManager from '@/components/admin/LocationManager'

export default async function AdminLocationsPage() {
  await requireAdmin()

  const locations = await getLocations()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Location Management</h1>
        <Link href="/admin/inventory">
          <Button variant="outline">Back to Inventory</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>Manage your warehouse and store locations</CardDescription>
        </CardHeader>
        <CardContent>
          <LocationManager locations={locations} />
        </CardContent>
      </Card>
    </div>
  )
}



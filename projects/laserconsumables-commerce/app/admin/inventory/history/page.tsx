import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getInventoryHistory } from '@/lib/services/inventory-advanced'
import { getLocations } from '@/lib/services/inventory-advanced'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import InventoryHistoryViewer from '@/components/admin/InventoryHistoryViewer'

export default async function AdminInventoryHistoryPage({
  searchParams,
}: {
  searchParams: { variantId?: string; locationId?: string; changeType?: string; page?: string }
}) {
  await requireAdmin()

  const [locations, history] = await Promise.all([
    getLocations(),
    getInventoryHistory({
      variantId: searchParams.variantId,
      locationId: searchParams.locationId,
      changeType: searchParams.changeType,
      page: parseInt(searchParams.page || '1'),
      limit: 50,
    }),
  ])

  const variants = await prisma.productVariant.findMany({
    include: {
      product: true,
    },
    orderBy: {
      product: {
        name: 'asc',
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory History</h1>
        <Link href="/admin/inventory">
          <Button variant="outline">Back to Inventory</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Change History</CardTitle>
          <CardDescription>View all inventory changes, adjustments, transfers, and sales</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryHistoryViewer
            locations={locations}
            variants={variants}
            history={history.history}
            pagination={history.pagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}



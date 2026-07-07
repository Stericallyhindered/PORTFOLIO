import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getLocations } from '@/lib/services/inventory-advanced'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import InventoryTransferManager from '@/components/admin/InventoryTransferManager'

export default async function AdminInventoryTransfersPage() {
  await requireAdmin()

  const [locations, transfers] = await Promise.all([
    getLocations(),
    prisma.inventoryTransfer.findMany({
      include: {
        fromLocation: true,
        toLocation: true,
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory Transfers</h1>
        <div className="flex gap-2">
          <Link href="/admin/inventory">
            <Button variant="outline">Back to Inventory</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Inventory Between Locations</CardTitle>
          <CardDescription>Move inventory from one location to another</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTransferManager locations={locations} transfers={transfers} />
        </CardContent>
      </Card>
    </div>
  )
}



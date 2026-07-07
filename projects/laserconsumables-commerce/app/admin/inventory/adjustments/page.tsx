import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getLocations } from '@/lib/services/inventory-advanced'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import InventoryAdjustmentManager from '@/components/admin/InventoryAdjustmentManager'

export default async function AdminInventoryAdjustmentsPage() {
  await requireAdmin()

  const [locations, adjustments] = await Promise.all([
    getLocations(),
    prisma.inventoryAdjustment.findMany({
      include: {
        location: true,
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
        <h1 className="text-3xl font-bold">Inventory Adjustments</h1>
        <Link href="/admin/inventory">
          <Button variant="outline">Back to Inventory</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adjust Inventory</CardTitle>
          <CardDescription>Manually adjust inventory quantities (add or remove stock)</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryAdjustmentManager locations={locations} variants={variants} adjustments={adjustments} />
        </CardContent>
      </Card>
    </div>
  )
}



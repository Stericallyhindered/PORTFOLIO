import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getLocations } from '@/lib/services/inventory-advanced'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import StocktakingManager from '@/components/admin/StocktakingManager'

export default async function AdminStocktakingPage() {
  await requireAdmin()

  const [locations, stocktakings] = await Promise.all([
    getLocations(),
    prisma.stocktaking.findMany({
      include: {
        location: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Stocktaking</h1>
        <Link href="/admin/inventory">
          <Button variant="outline">Back to Inventory</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Physical Inventory Count</CardTitle>
          <CardDescription>Perform physical inventory counts and reconcile with system quantities</CardDescription>
        </CardHeader>
        <CardContent>
          <StocktakingManager locations={locations} stocktakings={stocktakings} />
        </CardContent>
      </Card>
    </div>
  )
}



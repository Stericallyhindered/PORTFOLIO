import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getLowStockVariants, getOutOfStockVariants } from '@/lib/services/inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminDashboard() {
  await requireAdmin()

  // Get metrics
  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    totalCustomers,
    recentOrders,
    lowStockVariants,
    outOfStockVariants,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID' },
    }),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
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
    }),
    getLowStockVariants(10),
    getOutOfStockVariants(),
  ])

  const revenue = totalRevenue._sum.total || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(revenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
            <CardDescription>Active products</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
            <CardDescription>Registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCustomers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold">{formatPrice(order.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Low stock and out of stock items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockVariants.length === 0 && outOfStockVariants.length === 0 ? (
                <p className="text-gray-500">All items in stock</p>
              ) : (
                <>
                  {lowStockVariants.slice(0, 5).map((variant) => (
                    <div key={variant.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{variant.product.name}</p>
                        <p className="text-xs text-gray-500">{variant.sku}</p>
                      </div>
                      <p className="font-bold text-yellow-600 text-sm">
                        {variant.inventoryQuantity} left
                      </p>
                    </div>
                  ))}
                  {outOfStockVariants.slice(0, 5).map((variant) => (
                    <div key={variant.id} className="flex justify-between items-center p-2 border rounded border-red-200 bg-red-50">
                      <div>
                        <p className="font-medium text-sm">{variant.product.name}</p>
                        <p className="text-xs text-gray-500">{variant.sku}</p>
                      </div>
                      <p className="font-bold text-red-600 text-sm">Out of Stock</p>
                    </div>
                  ))}
                  {(lowStockVariants.length > 5 || outOfStockVariants.length > 5) && (
                    <Link href="/admin/inventory">
                      <Button variant="outline" className="w-full">
                        View All ({lowStockVariants.length + outOfStockVariants.length})
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


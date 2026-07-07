import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import {
  getLowStockVariants,
  getOutOfStockVariants,
  getBackorderVariants,
} from '@/lib/services/inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'
import BulkInventoryManager from '@/components/admin/BulkInventoryManager'
import { prisma } from '@/lib/db/prisma'

export default async function AdminInventoryPage() {
  await requireAdmin()

  const [lowStock, outOfStock, backorders, allVariants] = await Promise.all([
    getLowStockVariants(),
    getOutOfStockVariants(),
    getBackorderVariants(),
    prisma.productVariant.findMany({
      include: {
        product: true,
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Link href="/admin/products">
          <Button>Manage Products</Button>
        </Link>
      </div>

      <div className="mb-8">
        <BulkInventoryManager variants={allVariants} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Low Stock</CardTitle>
            <CardDescription>{lowStock.length} variants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lowStock.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Out of Stock</CardTitle>
            <CardDescription>{outOfStock.length} variants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{outOfStock.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">On Backorder</CardTitle>
            <CardDescription>{backorders.length} variants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{backorders.length}</p>
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items below threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStock.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {variant.product.images[0] && (
                      <Image
                        src={variant.product.images[0].url}
                        alt={variant.product.name}
                        width={64}
                        height={64}
                        className="rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{variant.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {variant.sku} • {variant.name || 'Default'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Threshold: {variant.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">
                      {variant.inventoryQuantity}
                    </p>
                    <p className="text-sm text-gray-500">units left</p>
                    <Link href={`/admin/products/${variant.productId}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        Update
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {outOfStock.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Out of Stock Items</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outOfStock.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50"
                >
                  <div className="flex items-center space-x-4">
                    {variant.product.images[0] && (
                      <Image
                        src={variant.product.images[0].url}
                        alt={variant.product.name}
                        width={64}
                        height={64}
                        className="rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{variant.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {variant.sku} • {variant.name || 'Default'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">0</p>
                    <p className="text-sm text-gray-500">units</p>
                    <Link href={`/admin/products/${variant.productId}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        Restock
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {backorders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backorder Items</CardTitle>
            <CardDescription>Items available for backorder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backorders.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50"
                >
                  <div className="flex items-center space-x-4">
                    {variant.product.images[0] && (
                      <Image
                        src={variant.product.images[0].url}
                        alt={variant.product.name}
                        width={64}
                        height={64}
                        className="rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{variant.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {variant.sku} • {variant.name || 'Default'}
                      </p>
                      {variant.backorderMessage && (
                        <p className="text-xs text-orange-600">
                          {variant.backorderMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">Backorder</p>
                    <Link href={`/admin/products/${variant.productId}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


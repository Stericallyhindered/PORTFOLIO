import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/db/prisma'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

export default async function AdminProductsPage() {
  await requireAdmin()

  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { price: 'asc' },
        take: 1,
      },
      images: {
        orderBy: { position: 'asc' },
        take: 1,
      },
      collections: {
        include: {
          collection: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {product.images[0] && (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="rounded"
                    />
                  )}
                  <div>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {product.variants[0] && formatPrice(product.variants[0].price)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {product.collections.map((c) => c.collection.name).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.status}
                  </span>
                  <Link href={`/admin/products/${product.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

async function getCollectionBySlug(slug: string) {
  try {
    const { getCollectionBySlug } = await import('@/lib/services/products')
    return await getCollectionBySlug(slug)
  } catch (error) {
    return null
  }
}

export default async function CollectionPage({
  params,
}: {
  params: { slug: string }
}) {
  const collection = await getCollectionBySlug(params.slug)

  if (!collection) {
    notFound()
  }

  const products = collection.products.map((pc) => pc.product)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{collection.name}</h1>
      {collection.description && (
        <p className="text-gray-600 mb-8">{collection.description}</p>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products in this collection yet.</p>
          <Link href="/products" className="text-primary hover:underline mt-4 inline-block">
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              {product.images[0] && (
                <div className="relative w-full h-48 bg-gray-100">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{product.name}</h3>
                {product.variants[0] && (
                  <p className="text-primary font-bold">
                    {formatPrice(product.variants[0].price)}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
        </div>
      )}
    </div>
  )
}


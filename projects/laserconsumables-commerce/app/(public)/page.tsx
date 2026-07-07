import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

async function getFeaturedData() {
  try {
    const { prisma } = await import('@/lib/db/prisma')
    const results = await Promise.all([
      prisma.product.findMany({
        where: { status: 'active' },
        include: {
          variants: {
            orderBy: { price: 'asc' },
            take: 1,
          },
          images: {
            orderBy: { position: 'asc' },
            take: 1,
          },
        },
        take: 8,
        orderBy: { name: 'asc' },
      }),
      prisma.collection.findMany({
        where: { featured: true },
        take: 4,
      }),
    ])
    return {
      products: results[0],
      collections: results[1],
    }
  } catch (error) {
    // Database not connected yet - return empty arrays
    return {
      products: [],
      collections: [],
    }
  }
}

export default async function HomePage() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(public)/page.tsx:44',message:'HomePage rendering',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AK'})}).catch(()=>{});
  // #endregion
  const { products: featuredProducts, collections: featuredCollections } = await getFeaturedData()
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/45b49db3-5b58-49a5-8f45-6fb3d6e7794a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'(public)/page.tsx:47',message:'HomePage data loaded',data:{productCount:featuredProducts.length,collectionCount:featuredCollections.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AL'})}).catch(()=>{});
  // #endregion

  return (
    <div className="min-h-screen">
      {/* Hero Section - Red/Black Theme */}
      <section className="bg-black text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <img 
              src="https://laserconsumables.com/cdn/shop/files/a66a5d4c-9d2c-446a-85c6-54f9fc311f8b.png?v=1714603007&width=400" 
              alt="Laser Consumables" 
              className="h-24 w-auto mx-auto"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-white">Laser Consumables</h1>
          <p className="text-xl mb-10 text-gray-300">
            Premium laser consumables and equipment
          </p>
          <Link href="/collections">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCollections.map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-xl font-semibold mb-2">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-gray-600 text-sm">{collection.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
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
            <div className="text-center mt-8">
              <Link href="/products">
                <Button variant="outline">View All Products</Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}


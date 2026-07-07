import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

async function getCollections() {
  try {
    const { getCollections } = await import('@/lib/services/products')
    return await getCollections()
  } catch (error) {
    return []
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Collections</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {collections.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">{collection.name}</h2>
                {collection.description && (
                  <p className="text-gray-600 text-sm">{collection.description}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}


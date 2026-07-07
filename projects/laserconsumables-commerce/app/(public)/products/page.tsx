import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { getInventoryStatus } from '@/lib/services/inventory'
import InventoryBadge from '@/components/products/InventoryBadge'
import ProductSort from '@/components/products/ProductSort'
import ProductPagination from '@/components/products/ProductPagination'

async function getProducts(
  sortBy: string = 'name',
  page: number = 1,
  itemsPerPage: number = 12
) {
  try {
    const { prisma } = await import('@/lib/db/prisma')
    let orderBy: any = { name: 'asc' } // Default to alphabetical
    
    // Handle sorting options
    switch (sortBy) {
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'name-desc':
        orderBy = { name: 'desc' }
        break
      case 'price':
        orderBy = { variants: { _min: { price: 'asc' } } }
        break
      case 'price-desc':
        orderBy = { variants: { _min: { price: 'desc' } } }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      default:
        orderBy = { name: 'asc' }
    }
    
    // Get total count for pagination
    const totalProducts = await prisma.product.count({
      where: { status: 'active' },
    })
    
    // Calculate skip for pagination
    const skip = (page - 1) * itemsPerPage
    
    const products = await prisma.product.findMany({
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
      orderBy,
      skip,
      take: itemsPerPage,
    })
    
    // For price sorting, we need to sort in memory since Prisma doesn't support nested sorting well
    if (sortBy === 'price' || sortBy === 'price-desc') {
      products.sort((a, b) => {
        const priceA = a.variants[0]?.price || 0
        const priceB = b.variants[0]?.price || 0
        return sortBy === 'price' ? priceA - priceB : priceB - priceA
      })
    }
    
    return { products, totalProducts }
  } catch (error) {
    return { products: [], totalProducts: 0 }
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { sort?: string; page?: string; perPage?: string }
}) {
  const sortBy = searchParams?.sort || 'name'
  const currentPage = Number(searchParams?.page) || 1
  const itemsPerPage = Number(searchParams?.perPage) || 12
  const { products, totalProducts } = await getProducts(sortBy, currentPage, itemsPerPage)

  // Get inventory status for each product's default variant
  const productsWithInventory = await Promise.all(
    products.map(async (product) => {
      try {
        const defaultVariant = product.variants[0]
        const inventoryStatus = defaultVariant
          ? await getInventoryStatus(defaultVariant.id)
          : null
        return { product, inventoryStatus }
      } catch (error) {
        return { product, inventoryStatus: null }
      }
    })
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Products</h1>
        <ProductSort />
      </div>

      {productsWithInventory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsWithInventory.map(({ product, inventoryStatus }) => (
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
                      <p className="text-primary font-bold mb-2">
                        {formatPrice(product.variants[0].price)}
                      </p>
                    )}
                    {inventoryStatus && (
                      <div className="mt-2">
                        <InventoryBadge status={inventoryStatus} showQuantity={false} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <ProductPagination
            totalProducts={totalProducts}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
        </>
      )}
    </div>
  )
}


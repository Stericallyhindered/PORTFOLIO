import { notFound } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import AddToCartButton from '@/components/products/AddToCartButton'
import ProductInventoryStatus from '@/components/products/ProductInventoryStatus'

async function getProductBySlug(slug: string) {
  try {
    const { getProductBySlug } = await import('@/lib/services/products')
    return await getProductBySlug(slug)
  } catch (error) {
    return null
  }
}

async function getInventoryStatusSafe(variantId: string) {
  try {
    const { getInventoryStatus } = await import('@/lib/services/inventory')
    return await getInventoryStatus(variantId)
  } catch (error) {
    return null
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await getProductBySlug(params.slug)

  if (!product) {
    notFound()
  }

  const defaultVariant = product.variants[0]
  
  // Get inventory status for default variant
  const inventoryStatus = defaultVariant
    ? await getInventoryStatusSafe(defaultVariant.id)
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          {product.images.length > 0 ? (
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          {defaultVariant && (
            <p className="text-2xl font-bold text-primary mb-4">
              {formatPrice(defaultVariant.price)}
            </p>
          )}

          {product.description && (
            <div className="mb-6">
              <p className="text-gray-600 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Variant</label>
              <select className="w-full px-3 py-2 border rounded-md">
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name || variant.sku} - {formatPrice(variant.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {defaultVariant && (
            <div className="space-y-4">
              <ProductInventoryStatus variantId={defaultVariant.id} />
              <AddToCartButton
                variantId={defaultVariant.id}
                initialStatus={inventoryStatus || undefined}
              />
            </div>
          )}

          {product.vendor && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Vendor:</span> {product.vendor}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


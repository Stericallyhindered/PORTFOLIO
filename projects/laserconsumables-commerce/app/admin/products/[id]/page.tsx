import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getProduct } from '@/lib/services/products'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import InventoryManager from '@/components/admin/InventoryManager'

export default async function AdminProductEditPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()

  const product = await getProduct(params.id)

  if (!product) {
    redirect('/admin/products')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Product: {product.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {product.variants.map((variant) => (
          <InventoryManager key={variant.id} variant={variant} />
        ))}
      </div>
    </div>
  )
}






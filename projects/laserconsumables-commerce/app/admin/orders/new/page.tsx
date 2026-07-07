import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ManualOrderForm from '@/components/admin/ManualOrderForm'

export default async function NewManualOrderPage() {
  await requireAdmin()

  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'active' },
      include: {
        variants: {
          orderBy: { price: 'asc' },
        },
        images: {
          orderBy: { position: 'asc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create Manual Order</h1>
        <Link href="/admin/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Order</CardTitle>
          <CardDescription>Create a manual order for testing or customer service</CardDescription>
        </CardHeader>
        <CardContent>
          <ManualOrderForm products={products} customers={customers} />
        </CardContent>
      </Card>
    </div>
  )
}



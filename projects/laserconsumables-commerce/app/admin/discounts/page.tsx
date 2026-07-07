import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function AdminDiscountsPage() {
  await requireAdmin()

  const discounts = await prisma.discountCode.findMany({
    include: {
      products: true,
      collections: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discount Codes</h1>
        <Link href="/admin/discounts/new">
          <Button>Create Discount</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Discount Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-lg">{discount.code}</p>
                  <p className="text-sm text-gray-500">
                    {discount.type === 'percentage'
                      ? `${discount.value}% off`
                      : `$${(discount.value / 100).toFixed(2)} off`}
                    {' • '}
                    {discount.usageCount} / {discount.usageLimit || '∞'} uses
                  </p>
                  {discount.expiresAt && (
                    <p className="text-xs text-gray-400">
                      Expires: {formatDate(discount.expiresAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      discount.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {discount.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






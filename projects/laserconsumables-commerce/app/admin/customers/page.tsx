import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminCustomersPage() {
  await requireAdmin()

  const customers = await prisma.customer.findMany({
    include: {
      user: true,
      orders: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Customers</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {customer.user.name || customer.user.email}
                  </p>
                  <p className="text-sm text-gray-500">{customer.user.email}</p>
                  {customer.phone && (
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Joined: {formatDate(customer.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{customer.orders.length} order(s)</p>
                  {customer.orders[0] && (
                    <p className="text-sm text-gray-500">
                      Last order: {formatDate(customer.orders[0].createdAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






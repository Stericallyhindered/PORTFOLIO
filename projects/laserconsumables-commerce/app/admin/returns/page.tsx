import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getReturns } from '@/lib/services/returns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ReturnsManager from '@/components/admin/ReturnsManager'

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; orderId?: string }
}) {
  await requireAdmin()

  const result = await getReturns({
    page: parseInt(searchParams.page || '1'),
    limit: 20,
    status: searchParams.status,
    orderId: searchParams.orderId,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Returns & Refunds</h1>
        <Link href="/admin/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
          <CardDescription>Process customer return requests and refunds</CardDescription>
        </CardHeader>
        <CardContent>
          <ReturnsManager
            returns={result.returns}
            pagination={result.pagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}



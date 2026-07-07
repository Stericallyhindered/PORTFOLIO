import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getAbandonedCarts } from '@/lib/services/abandoned-carts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import AbandonedCartsManager from '@/components/admin/AbandonedCartsManager'

export default async function AdminAbandonedCartsPage({
  searchParams,
}: {
  searchParams: { page?: string; recovered?: string }
}) {
  await requireAdmin()

  const result = await getAbandonedCarts({
    page: parseInt(searchParams.page || '1'),
    limit: 20,
    recovered: searchParams.recovered ? searchParams.recovered === 'true' : undefined,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Abandoned Carts</h1>
        <Link href="/admin/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abandoned Cart Recovery</CardTitle>
          <CardDescription>View and manage abandoned shopping carts</CardDescription>
        </CardHeader>
        <CardContent>
          <AbandonedCartsManager
            carts={result.carts}
            pagination={result.pagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}



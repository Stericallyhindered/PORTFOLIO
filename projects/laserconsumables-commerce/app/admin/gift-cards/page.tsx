import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { getGiftCards } from '@/lib/services/gift-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import GiftCardsManager from '@/components/admin/GiftCardsManager'

export default async function AdminGiftCardsPage({
  searchParams,
}: {
  searchParams: { page?: string; active?: string }
}) {
  await requireAdmin()

  const result = await getGiftCards({
    page: parseInt(searchParams.page || '1'),
    limit: 20,
    active: searchParams.active ? searchParams.active === 'true' : undefined,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gift Cards</h1>
        <Link href="/admin/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gift Card Management</CardTitle>
          <CardDescription>Create, view, and manage gift cards and store credit</CardDescription>
        </CardHeader>
        <CardContent>
          <GiftCardsManager
            giftCards={result.giftCards}
            pagination={result.pagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}



import { cookies } from 'next/headers'
import { getOrder } from './actions'
import { OrderDetailClient } from './OrderDetailClient'

interface PageProps {
  params: Promise<{ orderId: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const [cookieStore, resolvedParams] = await Promise.all([cookies(), params])
  const token = cookieStore.get('payload-token')?.value

  try {
    const order = await getOrder(resolvedParams.orderId, token)
    return (
      <>
        <OrderDetailClient order={order} />
      </>
    )
  } catch (error) {
    console.error('Error in AdminOrderDetailPage:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Error Loading Order</h1>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
      </div>
    )
  }
}

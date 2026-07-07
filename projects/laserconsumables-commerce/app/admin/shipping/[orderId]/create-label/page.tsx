import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getOrder } from '@/lib/services/orders'
import CreateLabelForm from '@/components/admin/CreateLabelForm'

export default async function CreateLabelPage({
  params,
}: {
  params: { orderId: string }
}) {
  await requireAdmin()

  const order = await getOrder(params.orderId)

  if (!order) {
    redirect('/admin/shipping')
  }

  if (!order.shippingAddress) {
    redirect(`/admin/orders/${params.orderId}`)
  }

  // Get ship-from address from settings
  const shipFromSettings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          'shipping_from_name',
          'shipping_from_address1',
          'shipping_from_address2',
          'shipping_from_city',
          'shipping_from_state',
          'shipping_from_zip',
          'shipping_from_country',
        ],
      },
    },
  })

  const settingsMap = shipFromSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>)

  // Calculate total weight from order items
  const totalWeight = order.items.reduce((sum, item) => {
    const variantWeight = item.variant.weight || 0.5 // Default 0.5 lbs if not set
    return sum + variantWeight * item.quantity
  }, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create Shipping Label</h1>
        <p className="text-gray-600">
          Order: <span className="font-medium">{order.orderNumber}</span>
        </p>
      </div>

      <CreateLabelForm
        order={order}
        shipFrom={{
          name: settingsMap['shipping_from_name'] || 'Laser Consumables',
          street1: settingsMap['shipping_from_address1'] || '',
          street2: settingsMap['shipping_from_address2'] || '',
          city: settingsMap['shipping_from_city'] || '',
          state: settingsMap['shipping_from_state'] || '',
          postalCode: settingsMap['shipping_from_zip'] || '',
          country: settingsMap['shipping_from_country'] || 'US',
        }}
        shipTo={{
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          street1: order.shippingAddress.address1,
          street2: order.shippingAddress.address2 || '',
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.zip,
          country: order.shippingAddress.country,
        }}
        defaultWeight={totalWeight}
      />
    </div>
  )
}






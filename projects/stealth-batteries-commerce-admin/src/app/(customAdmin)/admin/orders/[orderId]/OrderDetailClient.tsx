'use client'

import { Order, Customer, Dealer } from '@/payload-types'
import { OrderDetail } from '@/app/components/shared/OrderDetail'

interface PopulatedOrder extends Omit<Order, 'customer' | 'dealer'> {
  customer: Customer
  dealer?: Dealer
  packageTrackingNumbers?: Array<{
    number: string
    label?: string
    packageNumber?: number
    totalPackages?: number
  }> | null
}

interface OrderDetailClientProps {
  order: PopulatedOrder
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  return (
    <OrderDetail order={order} showActions={true} showDealerInfo={true} showCustomerInfo={true} />
  )
}

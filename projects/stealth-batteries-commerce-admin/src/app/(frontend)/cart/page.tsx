import React from 'react'
import Cart from '@/components/Cart'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'View your shopping cart and proceed to checkout',
}

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Cart />
    </div>
  )
}

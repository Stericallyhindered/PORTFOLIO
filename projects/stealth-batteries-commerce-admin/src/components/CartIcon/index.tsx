'use client'

import React from 'react'
import { CartDrawer } from '@/components/Cart/cart-drawer'

interface CartIconProps {
  'aria-label'?: string
}

export const CartIcon: React.FC<CartIconProps> = ({
  'aria-label': ariaLabel = 'Shopping cart',
}) => {
  return <CartDrawer aria-label={ariaLabel} />
}

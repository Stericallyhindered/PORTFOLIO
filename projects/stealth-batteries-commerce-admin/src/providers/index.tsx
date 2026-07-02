import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { CartProvider } from '@/context/CartContext'
import { Toaster } from '@/components/ui/sonner'
import { DealerDiscountProvider } from '@/components/DealerDiscountProvider'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <CartProvider>
        <DealerDiscountProvider>
          <HeaderThemeProvider>{children}</HeaderThemeProvider>
        </DealerDiscountProvider>
      </CartProvider>
      <Toaster />
    </ThemeProvider>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState, useCallback } from 'react'
import { useCart } from '@/context/CartContext'
import { cn } from '@/utilities/ui'

interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function LogoutButton({ className, ...props }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { clearDiscounts } = useCart()

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      // Clear all discounts from cart first
      clearDiscounts()

      // Determine which logout endpoint to use based on current path
      const currentPath = window.location.pathname
      const isSalesRep = currentPath.startsWith('/sales-rep')
      const logoutEndpoint = isSalesRep ? '/api/salesReps/logout' : '/api/dealers/logout'
      const redirectPath = isSalesRep ? '/sales-rep-login' : '/dealer-login'

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}${logoutEndpoint}`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      // Navigate to appropriate login page
      window.location.href = redirectPath
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout. Please try again.')
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, clearDiscounts])

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className={cn('gap-2', className)}
      disabled={isLoggingOut}
      {...props}
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  )
}

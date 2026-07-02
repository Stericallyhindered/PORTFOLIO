'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Dealer } from '@/payload-types'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: Dealer | null
}

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
  })

  const handleAuthError = useCallback(
    (error: string) => {
      console.log('Auth Error:', { error, pathname })
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error,
        user: null,
      }))

      // Only redirect if we're on a protected dealer route
      if (
        pathname.startsWith('/dealer') &&
        !pathname.includes('/dealer-login') &&
        !pathname.includes('/verify-email') &&
        !pathname.includes('/dealer-register')
      ) {
        console.log('Auth Error - Redirecting to login from:', pathname)
        router.push('/dealer-login')
      }
    },
    [router, pathname],
  )

  const checkAuth = useCallback(async () => {
    try {
      console.log('Checking auth for path:', pathname)

      // Skip auth check for non-dealer routes
      if (
        !pathname.startsWith('/dealer') ||
        pathname.includes('/dealer-login') ||
        pathname.includes('/verify-email') ||
        pathname.includes('/dealer-register')
      ) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      // Check if token exists
      const payloadToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('payload-token='))
        ?.split('=')[1]

      if (!payloadToken) {
        handleAuthError('No authentication token found')
        return
      }

      // Verify token with server and refresh it
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/refresh-token`,
        {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        },
      )

      if (!response.ok) {
        // If refresh fails, try the regular me endpoint as fallback
        const meResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!meResponse.ok) {
          // 404 is expected when user is not a dealer - don't log as error
          if (meResponse.status !== 404) {
            console.warn(`Auth dealer fetch failed with status ${meResponse.status}`)
          }
          // Clear invalid token
          document.cookie = 'payload-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
          handleAuthError('Invalid or expired token')
          return
        }

        const data = await meResponse.json()
        if (!data.user) {
          handleAuthError('User not found')
          return
        }

        // Check verification status
        const isEmailVerified = data.user._verified === true
        const isAdminVerified = data.user.verified === true

        if (!isEmailVerified) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: 'Email not verified',
            user: data.user,
          })
          if (!pathname.includes('/verify-email')) {
            router.push('/verify-email')
          }
          return
        }

        if (!isAdminVerified) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: 'Account not verified',
            user: data.user,
          })
          if (!pathname.includes('/dealer-register')) {
            router.push('/dealer-register/success?registered=pending')
          }
          return
        }

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          user: data.user,
        })
      } else {
        const data = await response.json()

        if (!data.user) {
          handleAuthError('User not found')
          return
        }

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          user: data.user,
        })
      }

      // Only redirect from login page to dashboard
      if (pathname === '/dealer-login') {
        router.push('/dealer/dashboard')
      }
    } catch (error) {
      handleAuthError('Authentication check failed')
    }
  }, [handleAuthError, router, pathname])

  useEffect(() => {
    checkAuth()
    // Set up interval to periodically check authentication
    const interval = setInterval(checkAuth, 5 * 60 * 1000) // Check every 5 minutes
    return () => clearInterval(interval)
  }, [checkAuth])

  return authState
}

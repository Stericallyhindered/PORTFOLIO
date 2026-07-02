import { useState, useEffect } from 'react'
import { Dealer } from '@/payload-types'

interface DealerResponse {
  user: Dealer
}

export function useDealer() {
  const [dealer, setDealer] = useState<Dealer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Note: This hook will attempt to fetch dealer data on all pages.
  // 404 responses in browser console are expected and normal when user is not a dealer.

  const fetchDealer = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/dealers/me`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        // 404 is expected when user is not a dealer - handle silently
        setDealer(null)
        setIsLoading(false)
        return
      }
      const data: DealerResponse = await response.json()
      setDealer(data.user ?? null)
      setIsLoading(false)
    } catch (err) {
      // Handle fetch errors silently to avoid console spam
      setDealer(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    fetchDealer()
    return () => {
      isMounted = false
    }
  }, [])

  // Expose a refreshDealer function for SPA updates
  const refreshDealer = fetchDealer

  return { dealer, isLoading, error, refreshDealer }
}

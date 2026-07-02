import { useState, useEffect } from 'react'
import type { SalesRep } from '@/payload-types'

interface SalesRepResponse {
  user: SalesRep | null
}

export function useSalesRep() {
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Note: This hook will attempt to fetch sales rep data on all pages.
  // 404 responses in browser console are expected and normal when user is not a sales rep.

  const fetchSalesRep = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/salesReps/me`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        // 404 is expected when user is not a sales rep - handle silently
        setSalesRep(null)
        setIsLoading(false)
        return
      }
      const data: SalesRepResponse = await response.json()
      setSalesRep(data.user ?? null)
      setIsLoading(false)
    } catch (err) {
      // Handle fetch errors silently to avoid console spam
      setSalesRep(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    fetchSalesRep()
    return () => {
      isMounted = false
    }
  }, [])

  // Expose a refreshSalesRep function for SPA updates
  const refreshSalesRep = fetchSalesRep

  return { salesRep, isLoading, error, refreshSalesRep }
}

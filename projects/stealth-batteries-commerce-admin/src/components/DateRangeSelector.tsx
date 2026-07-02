'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'

interface DateRangeSelectorProps {
  className?: string
}

export function DateRangeSelector({ className }: DateRangeSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const currentRange = searchParams.get('range') || '30'

  const handleRangeChange = (newRange: string) => {
    startTransition(() => {
      const url = new URL(window.location.href)
      url.searchParams.set('range', newRange)
      // Reset page when changing date range
      url.searchParams.set('page', '1')
      router.push(url.toString())
    })
  }

  return (
    <div className="relative">
      <select
        className={`bg-background text-foreground rounded-md border border-input px-3 py-2 pr-8 ${
          isPending ? 'opacity-50' : ''
        } ${className}`}
        value={currentRange}
        onChange={(e) => handleRangeChange(e.target.value)}
        disabled={isPending}
      >
        <option value="30">Last 30 Days</option>
        <option value="60">Last 60 Days</option>
        <option value="90">Last 90 Days</option>
        <option value="120">Last 120 Days</option>
        <option value="all">All Time</option>
      </select>
      {isPending && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useEffect } from 'react'
import { debugStructuredData } from '@/utilities/validateStructuredData'

interface StructuredDataDebugProps {
  enabled?: boolean
}

/**
 * Debug component for structured data validation
 * Only renders in development mode and when enabled
 */
export function StructuredDataDebug({ enabled = false }: StructuredDataDebugProps) {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return

    // Run debug after a short delay to ensure DOM is fully loaded
    const timer = setTimeout(() => {
      debugStructuredData()
    }, 1000)

    return () => clearTimeout(timer)
  }, [enabled])

  // Don't render anything in production or when disabled
  if (!enabled || process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#000',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        fontFamily: 'monospace',
      }}
    >
      🔍 Structured Data Debug Active
      <br />
      Check console for validation results
    </div>
  )
}

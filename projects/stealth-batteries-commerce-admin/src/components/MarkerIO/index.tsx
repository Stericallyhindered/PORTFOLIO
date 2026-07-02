'use client'

import { useEffect } from 'react'
import markerSDK from '@marker.io/browser'

export function MarkerIO() {
  useEffect(() => {
    const loadMarker = async () => {
      try {
        await markerSDK.loadWidget({
          project: '67abb3ac354a5dc87cf170b6',
        })
      } catch (error) {
        console.error('Failed to load Marker.io:', error)
      }
    }

    loadMarker()
  }, [])

  return null
}

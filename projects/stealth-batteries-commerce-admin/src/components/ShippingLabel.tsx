'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { ShippingLabelViewer } from '@/components/shipping/ShippingLabelViewer'

interface ShippingLabelProps {
  orderId: string | number
  trackingNumber?: string
  packageTrackingNumbers?: Array<{
    number: string
    label?: string
    packageNumber?: number
    totalPackages?: number
  }>
}

export function ShippingLabel({
  orderId,
  trackingNumber,
  packageTrackingNumbers,
}: ShippingLabelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [labels, setLabels] = useState<string[]>([])

  const handleViewLabel = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Log available data
      console.log('ShippingLabel data:', {
        orderId,
        trackingNumber,
        packageTrackingNumbers,
        hasLabelData: packageTrackingNumbers?.some((pkg) => pkg.label),
      })

      // Collect all available labels
      const availableLabels =
        packageTrackingNumbers
          ?.filter((pkg) => pkg.label)
          .map((pkg) => {
            // If the label is already a data URL, use it as is
            if (pkg.label?.startsWith('data:')) {
              return pkg.label
            }
            // Otherwise, convert the base64 to a data URL
            return `data:image/gif;base64,${pkg.label}`
          }) || []

      if (availableLabels.length > 0) {
        console.log('Using stored label data URLs')
        setLabels(availableLabels)
        setShowViewer(true)
        return
      }

      console.log('No stored labels found, fetching from API...')
      // Otherwise, fetch from the API
      const response = await fetch(`/api/shipping/label/${orderId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch label:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        })
        throw new Error(`Failed to fetch shipping label: ${response.status} ${response.statusText}`)
      }

      const data = await response.blob()
      const url = URL.createObjectURL(data)
      setLabels([url])
      setShowViewer(true)

      // Clean up the URL object after viewer is closed
      return () => URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error in handleViewLabel:', err)
      setError(err instanceof Error ? err.message : 'Failed to view shipping label')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter out packages without tracking numbers
  const validPackages =
    packageTrackingNumbers?.filter((pkg) => pkg.number && pkg.number !== 'undefined') || []

  // Only show tracking info if we have valid tracking numbers
  const hasValidTrackingInfo =
    (trackingNumber && trackingNumber !== 'undefined') || validPackages.length > 0

  if (!hasValidTrackingInfo) {
    return null
  }

  return (
    <div className="space-y-4 rounded-lg border p-6 h-full flex flex-col justify-between">
      <h3 className="text-lg font-semibold">Shipping Information</h3>

      {trackingNumber && trackingNumber !== 'undefined' && (
        <div>
          <p className="text-sm text-gray-500">Tracking Number</p>
          <p className="font-mono">{trackingNumber}</p>
        </div>
      )}

      {validPackages.length > 0 && (
        <div>
          <p className="text-sm text-gray-500">Package Tracking Numbers</p>
          <ul className="space-y-2">
            {validPackages.map((pkg, index) => (
              <li key={`${pkg.number}-${index}`} className="font-mono">
                {pkg.packageNumber && pkg.totalPackages
                  ? `Package ${pkg.packageNumber} of ${pkg.totalPackages}: `
                  : validPackages.length > 1
                    ? `Package ${index + 1} of ${validPackages.length}: `
                    : ''}
                {pkg.number}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={handleViewLabel} disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'View Shipping Label'
        )}
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {showViewer && labels.length > 0 && (
        <ShippingLabelViewer
          labels={labels}
          onClose={() => {
            setShowViewer(false)
            // Clean up any object URLs
            labels.forEach((label) => {
              if (label.startsWith('blob:')) {
                URL.revokeObjectURL(label)
              }
            })
            setLabels([])
          }}
        />
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Plus, Trash2, Package as PackageIcon } from 'lucide-react'
import { UPSServiceCodes, UPSServiceNames } from '@/lib/shipping/constants/ups'
import type { Package } from '@/lib/shipping/services/ups'
import type { Order, Customer, Dealer } from '@/payload-types'

interface PopulatedOrder extends Omit<Order, 'customer' | 'dealer'> {
  customer: Customer
  dealer?: Dealer
  shippingService?: string | null
  trackingNumber?: string | null
  packageTrackingNumbers?: Array<{
    number: string
    label?: string
    packageNumber?: number
    totalPackages?: number
  }> | null
  shippedAt?: string | null
}

interface PackageConfig {
  id: string
  weight: number
  length: number
  width: number
  height: number
  isHazmat: boolean
}

interface Props {
  order: PopulatedOrder
  onLabelCreated?: () => void
  onRefreshOrderData?: () => Promise<void>
}

export function CreateShippingLabel({
  order: initialOrder,
  onLabelCreated,
  onRefreshOrderData,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [order, setOrder] = useState<PopulatedOrder>(initialOrder)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [packages, setPackages] = useState<PackageConfig[]>([])
  const [selectedService, setSelectedService] = useState<string>(() => {
    // If the order has a shipping service and it's a valid UPS service code, use it
    if (initialOrder.shippingService && UPSServiceNames[initialOrder.shippingService]) {
      return initialOrder.shippingService
    }
    // Otherwise default to Ground
    return UPSServiceCodes.GROUND
  })

  // Check if this is a dealer order with flat-rate shipping
  const isDealerOrder = !!order.dealer
  const hasNoShippingService = !order.shippingService

  const refreshOrderData = async () => {
    try {
      const response = await fetch(
        `/api/orders/${order.id}?depth=3&populate=items.product,items.product.shippingDetails`,
      )
      if (!response.ok) {
        throw new Error('Failed to refresh order data')
      }
      const refreshedOrder = await response.json()
      setOrder(refreshedOrder)
      return refreshedOrder
    } catch (err) {
      console.error('Error refreshing order data:', err)
      throw err
    }
  }

  // Generate default packages based on order items
  const generateDefaultPackages = (orderData: PopulatedOrder): PackageConfig[] => {
    if (!orderData.items?.length) return []

    const defaultPackages: PackageConfig[] = []
    let packageId = 1

    orderData.items.forEach((item) => {
      if (!item.product || typeof item.product !== 'object' || !item.product.shippingDetails) {
        return
      }

      const shippingDetails = item.product.shippingDetails

      // Create a separate package for each individual item quantity
      for (let i = 0; i < item.quantity; i++) {
        defaultPackages.push({
          id: `package-${packageId++}`,
          weight: shippingDetails.weight,
          length: shippingDetails.length,
          width: shippingDetails.width,
          height: shippingDetails.height,
          isHazmat: shippingDetails.hazmat || false,
        })
      }
    })

    return defaultPackages
  }

  // Initialize packages when showing config form
  useEffect(() => {
    if (showConfigForm && packages.length === 0) {
      const defaultPackages = generateDefaultPackages(order)
      setPackages(defaultPackages)
    }
  }, [showConfigForm, order, packages.length])

  const handleShowConfigForm = async () => {
    try {
      // Refresh order data to get latest information
      const refreshedOrder = await refreshOrderData()
      const defaultPackages = generateDefaultPackages(refreshedOrder)
      setPackages(defaultPackages)
      setShowConfigForm(true)
      setError(null)
    } catch (err) {
      setError('Failed to load order data. Please try again.')
    }
  }

  const addPackage = () => {
    const newPackage: PackageConfig = {
      id: `package-${Date.now()}`,
      weight: 1,
      length: 12,
      width: 12,
      height: 6,
      isHazmat: false,
    }
    setPackages([...packages, newPackage])
  }

  const removePackage = (packageId: string) => {
    setPackages(packages.filter((pkg) => pkg.id !== packageId))
  }

  const updatePackage = (packageId: string, field: keyof PackageConfig, value: any) => {
    setPackages(packages.map((pkg) => (pkg.id === packageId ? { ...pkg, [field]: value } : pkg)))
  }

  const validatePackages = (): string | null => {
    if (packages.length === 0) {
      return 'At least one package is required'
    }

    for (const pkg of packages) {
      if (pkg.weight <= 0) {
        return 'All packages must have a weight greater than 0'
      }
      if (pkg.length <= 0 || pkg.width <= 0 || pkg.height <= 0) {
        return 'All dimensions must be greater than 0'
      }
      if (pkg.weight > 150) {
        return 'Package weight cannot exceed 150 lbs'
      }
      if (pkg.length > 108 || pkg.width > 108 || pkg.height > 108) {
        return 'Package dimensions cannot exceed 108 inches'
      }
    }

    return null
  }

  const handleGenerateLabel = async () => {
    const validationError = validatePackages()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Get refreshed order data
      const refreshedOrder = await refreshOrderData()

      // Convert PackageConfig to Package format for API
      const apiPackages: Package[] = packages.map((pkg) => ({
        dimensions: {
          length: pkg.length,
          width: pkg.width,
          height: pkg.height,
          unit: 'IN',
        },
        weight: pkg.weight,
        weight_unit: 'LBS',
        packaging_type: '02', // Customer Supplied Package
        is_hazmat: pkg.isHazmat,
      }))

      // First update the order with the selected shipping service and status
      const updateResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingService: selectedService,
          status: 'completed',
          shippedAt: new Date().toISOString(),
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(`Failed to update order: ${errorData.error || 'Unknown error'}`)
      }

      // Create the shipping label
      const labelResponse = await fetch('/api/shipping/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          destination: {
            name: `${refreshedOrder.shippingAddress.firstName} ${refreshedOrder.shippingAddress.lastName}`,
            address: refreshedOrder.shippingAddress.line1,
            city: refreshedOrder.shippingAddress.city,
            state: refreshedOrder.shippingAddress.state,
            postalCode: refreshedOrder.shippingAddress.postalCode,
            country: refreshedOrder.shippingAddress.country,
          },
          service_code: selectedService,
          reference_number: refreshedOrder.id,
          notification_email: refreshedOrder.customer.email,
          packages: apiPackages,
        }),
      })

      if (!labelResponse.ok) {
        const data = await labelResponse.json()
        throw new Error(data.error || 'Failed to create shipping label')
      }

      const shipment = await labelResponse.json()

      // Update order with tracking numbers
      const packageTrackingNumbers = shipment.packages.map((pkg, index) => ({
        number: String(pkg.tracking_number),
        label: pkg.label_url,
        packageNumber: index + 1,
        totalPackages: shipment.packages.length,
      }))

      // Update order with tracking numbers
      const trackingUpdateResponse = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber: String(shipment.tracking_number),
          packageTrackingNumbers,
          status: 'completed',
          shippedAt: new Date().toISOString(),
        }),
      })

      if (!trackingUpdateResponse.ok) {
        const responseText = await trackingUpdateResponse.text()
        throw new Error(`Failed to update order: ${responseText}`)
      }

      // Open shipping labels in new tabs
      shipment.packages.forEach((pkg, index) => {
        if (pkg.label) {
          window.open(pkg.label, '_blank')
        }
      })

      setSuccess(true)
      setSuccessMessage(
        `Shipping labels created successfully! Tracking number: ${shipment.tracking_number}`,
      )

      // Reset form state
      setShowConfigForm(false)
      setPackages([])

      // Refresh order data to show updated tracking numbers
      if (onRefreshOrderData) {
        await onRefreshOrderData()
      } else {
        await refreshOrderData()
      }

      // Notify parent component that label was created
      onLabelCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipping label')
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfigForm) {
    return (
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Configure Shipping Packages
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and modify the package configuration before generating shipping labels.
          </p>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="space-y-6">
            {/* Shipping Service Selection */}
            <div>
              <Label htmlFor="shipping-service">Shipping Service</Label>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
                disabled={isLoading}
              >
                <SelectTrigger id="shipping-service">
                  <SelectValue placeholder="Select a shipping service" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UPSServiceCodes).map(([key, code]) => (
                    <SelectItem key={code} value={code}>
                      {UPSServiceNames[code]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Packages Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Packages ({packages.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPackage}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Package
                </Button>
              </div>

              {packages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No packages configured</p>
                  <p className="text-sm">Add at least one package to continue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg, index) => (
                    <Card key={pkg.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Package {index + 1}</h4>
                        {packages.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePackage(pkg.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label htmlFor={`weight-${pkg.id}`} className="text-xs">
                            Weight (lbs)
                          </Label>
                          <Input
                            id={`weight-${pkg.id}`}
                            type="number"
                            min="0.1"
                            max="150"
                            step="0.1"
                            value={pkg.weight}
                            onChange={(e) =>
                              updatePackage(pkg.id, 'weight', parseFloat(e.target.value) || 0)
                            }
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`length-${pkg.id}`} className="text-xs">
                            Length (in)
                          </Label>
                          <Input
                            id={`length-${pkg.id}`}
                            type="number"
                            min="1"
                            max="108"
                            value={pkg.length}
                            onChange={(e) =>
                              updatePackage(pkg.id, 'length', parseInt(e.target.value) || 0)
                            }
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`width-${pkg.id}`} className="text-xs">
                            Width (in)
                          </Label>
                          <Input
                            id={`width-${pkg.id}`}
                            type="number"
                            min="1"
                            max="108"
                            value={pkg.width}
                            onChange={(e) =>
                              updatePackage(pkg.id, 'width', parseInt(e.target.value) || 0)
                            }
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`height-${pkg.id}`} className="text-xs">
                            Height (in)
                          </Label>
                          <Input
                            id={`height-${pkg.id}`}
                            type="number"
                            min="1"
                            max="108"
                            value={pkg.height}
                            onChange={(e) =>
                              updatePackage(pkg.id, 'height', parseInt(e.target.value) || 0)
                            }
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={pkg.isHazmat}
                            onChange={(e) => updatePackage(pkg.id, 'isHazmat', e.target.checked)}
                            disabled={isLoading}
                            className="rounded"
                          />
                          <span className="text-sm">Hazardous material</span>
                        </label>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfigForm(false)
                  setPackages([])
                  setError(null)
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateLabel}
                disabled={isLoading || packages.length === 0}
                className="flex-1"
              >
                {isLoading ? 'Generating Labels...' : 'Generate Shipping Labels'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Shipping Label</h2>

      {isDealerOrder && hasNoShippingService && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This is a dealer order with flat-rate shipping. Please configure shipping to create the
            label.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure shipping packages and generate shipping labels for this order.
        </p>

        <Button onClick={handleShowConfigForm} disabled={isLoading} className="w-full">
          Configure Shipping Packages
        </Button>
      </div>
    </Card>
  )
}

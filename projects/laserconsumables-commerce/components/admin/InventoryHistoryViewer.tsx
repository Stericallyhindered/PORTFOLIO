'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface Location {
  id: string
  name: string
}

interface Variant {
  id: string
  sku: string | null
  name: string | null
  product: {
    name: string
  }
}

interface HistoryItem {
  id: string
  variantId: string
  locationId: string | null
  changeType: string
  quantityBefore: number
  quantityAfter: number
  quantityChange: number
  reason: string | null
  createdAt: Date
  variant: Variant
  location: Location | null
}

interface InventoryHistoryViewerProps {
  locations: Location[]
  variants: Variant[]
  history: HistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function InventoryHistoryViewer({
  locations,
  variants,
  history,
  pagination,
}: InventoryHistoryViewerProps) {
  const router = useRouter()
  const [filters, setFilters] = useState({
    variantId: '',
    locationId: '',
    changeType: '',
  })

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (filters.variantId) params.set('variantId', filters.variantId)
    if (filters.locationId) params.set('locationId', filters.locationId)
    if (filters.changeType) params.set('changeType', filters.changeType)
    router.push(`/admin/inventory/history?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          History ({pagination.total} records)
        </h3>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="variantId">Variant</Label>
              <Select
                id="variantId"
                value={filters.variantId}
                onChange={(e) => setFilters({ ...filters, variantId: e.target.value })}
              >
                <option value="">All Variants</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.product.name} {v.name && `- ${v.name}`}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="locationId">Location</Label>
              <Select
                id="locationId"
                value={filters.locationId}
                onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
              >
                <option value="">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="changeType">Change Type</Label>
              <Select
                id="changeType"
                value={filters.changeType}
                onChange={(e) => setFilters({ ...filters, changeType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer">Transfer</option>
                <option value="sale">Sale</option>
                <option value="return">Return</option>
                <option value="reservation">Reservation</option>
                <option value="release">Release</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter}>Filter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {history.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {item.variant.product.name} {item.variant.name && `- ${item.variant.name}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Location: {item.location?.name || 'Global'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Type: <span className="font-semibold">{item.changeType}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantityBefore} → {item.quantityAfter} (
                    <span className={item.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.quantityChange >= 0 ? '+' : ''}{item.quantityChange}
                    </span>)
                  </p>
                  {item.reason && <p className="text-sm text-gray-600">Reason: {item.reason}</p>}
                  <p className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => router.push(`/admin/inventory/history?page=${pagination.page - 1}`)}
          >
            Previous
          </Button>
          <span className="flex items-center">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => router.push(`/admin/inventory/history?page=${pagination.page + 1}`)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}



'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Edit,
  ExternalLink,
  Search,
  HelpCircle,
  Save,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

// Persistent state hook
function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
    }
  }, [key])

  const setPersistentState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        if (isClient) {
          try {
            localStorage.setItem(key, JSON.stringify(newValue))
          } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error)
          }
        }
        return newValue
      })
    },
    [key, isClient],
  )

  return [state, setPersistentState] as const
}

type Product = {
  id: string
  title: string
  displayName?: string
  productType: 'battery' | 'accessory' | 'swag'
  modelNumber?: string
  price: number
  dealerPrice: number
  inventory: {
    trackInventory: boolean
    quantity: number
    lowStockThreshold: number
  }
  heroImage?: {
    url?: string
    alt?: string
  }
  productCategories?: Array<{
    id: string
    title: string
  }>
  updatedAt: string
}

type ProductsResponse = {
  docs: Product[]
  totalDocs: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

type EditingInventory = {
  productId: string
  quantity: number
  lowStockThreshold: number
  trackInventory: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalDocs, setTotalDocs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)

  // Persistent state
  const [currentPage, setCurrentPage] = usePersistentState('products-page', 1)
  const [pageSize, setPageSize] = usePersistentState('products-pageSize', 20)
  const [searchQuery, setSearchQuery] = usePersistentState('products-search', '')
  const [inventoryStatus, setInventoryStatus] = usePersistentState(
    'products-inventoryStatus',
    'all',
  )
  const [productType, setProductType] = usePersistentState('products-productType', 'all')

  // Editing state
  const [editingInventory, setEditingInventory] = useState<EditingInventory | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build where clause for Payload API
      const where: any = {}

      // Search functionality
      if (searchQuery) {
        where.or = [
          { title: { contains: searchQuery } },
          { displayName: { contains: searchQuery } },
          { modelNumber: { contains: searchQuery } },
        ]
      }

      // Product type filter
      if (productType !== 'all') {
        where.productType = { equals: productType }
      }

      // Inventory status filter
      if (inventoryStatus !== 'all') {
        switch (inventoryStatus) {
          case 'in-stock':
            where['inventory.quantity'] = { greater_than: 0 }
            break
          case 'low-stock':
            where.and = [
              { 'inventory.quantity': { greater_than: 0 } },
              { 'inventory.quantity': { less_than_equal: 'inventory.lowStockThreshold' } },
            ]
            break
          case 'out-of-stock':
            where['inventory.quantity'] = { equals: 0 }
            break
        }
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        where: JSON.stringify(where),
        sort: '-updatedAt',
        depth: '2',
      })

      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data: ProductsResponse = await response.json()
      setProducts(data.docs)
      setTotalDocs(data.totalDocs)
      setTotalPages(data.totalPages)
      setHasNextPage(data.hasNextPage)
      setHasPrevPage(data.hasPrevPage)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchQuery, inventoryStatus, productType])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'inventoryStatus') {
      setInventoryStatus(value)
    } else if (type === 'productType') {
      setProductType(value)
    }
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size, 10))
    setCurrentPage(1)
  }

  const getInventoryStatus = (product: Product) => {
    if (!product.inventory.trackInventory) {
      return { status: 'not-tracked', label: 'Not Tracked', color: 'bg-gray-500' }
    }

    if (product.inventory.quantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-500' }
    }

    if (product.inventory.quantity <= product.inventory.lowStockThreshold) {
      return { status: 'low-stock', label: 'Low Stock', color: 'bg-yellow-500' }
    }

    return { status: 'in-stock', label: 'In Stock', color: 'bg-green-500' }
  }

  const handleEditInventory = (product: Product) => {
    setEditingInventory({
      productId: product.id,
      quantity: product.inventory.quantity,
      lowStockThreshold: product.inventory.lowStockThreshold,
      trackInventory: product.inventory.trackInventory,
    })
  }

  const handleSaveInventory = async () => {
    if (!editingInventory) return

    try {
      setIsUpdating(true)

      const response = await fetch(`/api/products/${editingInventory.productId}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: editingInventory.quantity,
          lowStockThreshold: editingInventory.lowStockThreshold,
          trackInventory: editingInventory.trackInventory,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update inventory')
      }

      // Update the product in the local state
      setProducts((prev) =>
        prev.map((product) =>
          product.id === editingInventory.productId
            ? {
                ...product,
                inventory: {
                  ...product.inventory,
                  quantity: editingInventory.quantity,
                  lowStockThreshold: editingInventory.lowStockThreshold,
                  trackInventory: editingInventory.trackInventory,
                },
              }
            : product,
        ),
      )

      setEditingInventory(null)
      toast.success('Inventory updated successfully')
    } catch (err) {
      console.error('Error updating inventory:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update inventory')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingInventory(null)
  }

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage products and inventory levels ({totalDocs} total)
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Products Page Help</h4>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Search:</strong> Search by product title, display name, or model number
                </div>
                <div>
                  <strong>Inventory Status:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge className="bg-green-500">In Stock</Badge>
                    <Badge className="bg-yellow-500">Low Stock</Badge>
                    <Badge className="bg-red-500">Out of Stock</Badge>
                    <Badge className="bg-gray-500">Not Tracked</Badge>
                  </div>
                </div>
                <div>
                  <strong>Quick Edit:</strong> Click the edit icon to update inventory levels inline
                </div>
                <div>
                  <strong>Full Edit:</strong> Click &quot;Edit&quot; to open the product in Payload
                  admin
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={inventoryStatus}
              onValueChange={(value) => handleFilterChange('inventoryStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Inventory Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={productType}
              onValueChange={(value) => handleFilterChange('productType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Product Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="battery">Battery</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
                <SelectItem value="swag">Swag</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchProducts} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {products.map((product) => {
          const inventoryInfo = getInventoryStatus(product)

          return (
            <Card key={product.id} className="relative flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">
                      {product.displayName || product.title}
                    </CardTitle>
                    <div className="h-6 mt-1">
                      {product.modelNumber ? (
                        <p className="text-sm text-gray-500">Model: {product.modelNumber}</p>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                  {product.heroImage?.url && (
                    <div className="ml-4 flex-shrink-0">
                      <Image
                        src={product.heroImage.url}
                        alt={product.heroImage.alt || product.title}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="capitalize">
                    {product.productType}
                  </Badge>
                  <Badge className={`text-white ${inventoryInfo.color}`}>
                    {inventoryInfo.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <p className="font-semibold">${product.price}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Dealer Price:</span>
                    <p className="font-semibold">${product.dealerPrice}</p>
                  </div>
                </div>

                <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-200">Inventory</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditInventory(product)}
                      className="h-6 w-6 p-0 hover:bg-gray-700"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>

                  {product.inventory.trackInventory ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Quantity:</span>
                        <span className="font-semibold text-gray-100">
                          {product.inventory.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Low Stock:</span>
                        <span className="text-gray-100">{product.inventory.lowStockThreshold}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not tracking inventory</p>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link href={`/admin/collections/products/${product.id}`} target="_blank">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {products.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-gray-600">
              {searchQuery || inventoryStatus !== 'all' || productType !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No products have been created yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalDocs)} of {totalDocs} products
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm px-3">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Edit Dialog */}
      <Dialog open={!!editingInventory} onOpenChange={() => !isUpdating && handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory</DialogTitle>
            <DialogDescription>Update inventory settings for this product.</DialogDescription>
          </DialogHeader>

          {editingInventory && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trackInventory"
                  checked={editingInventory.trackInventory}
                  onCheckedChange={(checked) =>
                    setEditingInventory((prev) =>
                      prev ? { ...prev, trackInventory: !!checked } : null,
                    )
                  }
                />
                <Label htmlFor="trackInventory">Track inventory for this product</Label>
              </div>

              {editingInventory.trackInventory && (
                <>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={editingInventory.quantity}
                      onChange={(e) =>
                        setEditingInventory((prev) =>
                          prev ? { ...prev, quantity: parseInt(e.target.value) || 0 } : null,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      value={editingInventory.lowStockThreshold}
                      onChange={(e) =>
                        setEditingInventory((prev) =>
                          prev
                            ? { ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }
                            : null,
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={isUpdating}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveInventory} disabled={isUpdating}>
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

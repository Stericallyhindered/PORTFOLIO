'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  slug: string
  variants: Array<{
    id: string
    name: string | null
    sku: string | null
    price: number
    inventoryQuantity: number
  }>
  images: Array<{
    url: string
  }>
}

interface Customer {
  id: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface OrderItem {
  variantId: string
  productId: string
  quantity: number
  price: number
  productName: string
  variantName: string
}

interface ManualOrderFormProps {
  products: Product[]
  customers: Customer[]
}

export default function ManualOrderForm({ products, customers }: ManualOrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    customerId: '',
    email: '',
    phone: '',
    orderItems: [] as OrderItem[],
    shippingAddress: {
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
    },
    billingAddress: {
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
    },
    useShippingForBilling: true,
    notes: '',
  })

  const [currentItem, setCurrentItem] = useState({
    productId: '',
    variantId: '',
    quantity: '1',
  })

  const addItem = () => {
    if (!currentItem.productId || !currentItem.variantId) return

    const product = products.find((p) => p.id === currentItem.productId)
    const variant = product?.variants.find((v) => v.id === currentItem.variantId)

    if (!product || !variant) return

    const existingIndex = formData.orderItems.findIndex(
      (item) => item.variantId === currentItem.variantId
    )

    if (existingIndex >= 0) {
      const updated = [...formData.orderItems]
      updated[existingIndex].quantity += parseInt(currentItem.quantity)
      setFormData({ ...formData, orderItems: updated })
    } else {
      setFormData({
        ...formData,
        orderItems: [
          ...formData.orderItems,
          {
            variantId: currentItem.variantId,
            productId: currentItem.productId,
            quantity: parseInt(currentItem.quantity),
            price: variant.price,
            productName: product.name,
            variantName: variant.name || 'Default',
          },
        ],
      })
    }

    setCurrentItem({ productId: '', variantId: '', quantity: '1' })
  }

  const removeItem = (index: number) => {
    const updated = [...formData.orderItems]
    updated.splice(index, 1)
    setFormData({ ...formData, orderItems: updated })
  }

  const calculateTotals = () => {
    const subtotal = formData.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    const tax = Math.round(subtotal * 0.08) // 8% tax
    const shipping = 0 // Free shipping for manual orders
    const total = subtotal + tax + shipping

    return { subtotal, tax, shipping, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { subtotal, tax, shipping, total } = calculateTotals()

      const response = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subtotal,
          tax,
          shipping,
          total,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const { order } = await response.json()
      router.push(`/admin/orders/${order.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === currentItem.productId)
  const { subtotal, tax, shipping, total } = calculateTotals()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      )}

      {/* Customer Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerId">Customer (optional)</Label>
          <Select
            id="customerId"
            value={formData.customerId}
            onChange={(e) => {
              const customer = customers.find((c) => c.id === e.target.value)
              setFormData({
                ...formData,
                customerId: e.target.value,
                email: customer?.user.email || '',
              })
            }}
          >
            <option value="">Guest Order</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.user.name || customer.user.email}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      {/* Add Items */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Add Items</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="productId">Product</Label>
              <Select
                id="productId"
                value={currentItem.productId}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    productId: e.target.value,
                    variantId: '',
                  })
                }
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="variantId">Variant</Label>
              <Select
                id="variantId"
                value={currentItem.variantId}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, variantId: e.target.value })
                }
                disabled={!selectedProduct}
              >
                <option value="">Select variant</option>
                {selectedProduct?.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name || 'Default'} - {formatPrice(variant.price)} (Qty: {variant.inventoryQuantity})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, quantity: e.target.value })
                  }
                />
              </div>
              <Button type="button" onClick={addItem} disabled={!currentItem.variantId}>
                Add
              </Button>
            </div>
          </div>

          {/* Order Items List */}
          {formData.orderItems.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Order Items</h4>
              <div className="space-y-2">
                {formData.orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      {item.variantName !== 'Default' && (
                        <span className="text-gray-600"> - {item.variantName}</span>
                      )}
                      <span className="text-gray-600"> x {item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-semibold">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-semibold">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Shipping Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingFirstName">First Name *</Label>
              <Input
                id="shippingFirstName"
                value={formData.shippingAddress.firstName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      firstName: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingLastName">Last Name *</Label>
              <Input
                id="shippingLastName"
                value={formData.shippingAddress.lastName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      lastName: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="shippingAddress1">Address *</Label>
              <Input
                id="shippingAddress1"
                value={formData.shippingAddress.address1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      address1: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="shippingAddress2">Address 2</Label>
              <Input
                id="shippingAddress2"
                value={formData.shippingAddress.address2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      address2: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="shippingCity">City *</Label>
              <Input
                id="shippingCity"
                value={formData.shippingAddress.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      city: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingState">State *</Label>
              <Input
                id="shippingState"
                value={formData.shippingAddress.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      state: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingZip">ZIP Code *</Label>
              <Input
                id="shippingZip"
                value={formData.shippingAddress.zip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      zip: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingCountry">Country</Label>
              <Input
                id="shippingCountry"
                value={formData.shippingAddress.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingAddress: {
                      ...formData.shippingAddress,
                      country: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          id="useShippingForBilling"
          checked={formData.useShippingForBilling}
          onChange={(e) =>
            setFormData({ ...formData, useShippingForBilling: e.target.checked })
          }
        />
        <Label htmlFor="useShippingForBilling">Use shipping address for billing</Label>
      </div>

      {!formData.useShippingForBilling && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Billing Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billingFirstName">First Name *</Label>
                <Input
                  id="billingFirstName"
                  value={formData.billingAddress.firstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAddress: {
                        ...formData.billingAddress,
                        firstName: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingLastName">Last Name *</Label>
                <Input
                  id="billingLastName"
                  value={formData.billingAddress.lastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAddress: {
                        ...formData.billingAddress,
                        lastName: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="billingAddress1">Address *</Label>
                <Input
                  id="billingAddress1"
                  value={formData.billingAddress.address1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAddress: {
                        ...formData.billingAddress,
                        address1: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingCity">City *</Label>
                <Input
                  id="billingCity"
                  value={formData.billingAddress.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAddress: {
                        ...formData.billingAddress,
                        city: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingState">State *</Label>
                <Input
                  id="billingState"
                  value={formData.billingAddress.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAddress: {
                        ...formData.billingAddress,
                        state: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingZip">ZIP Code *</Label>
                <Input
                  id="billingZip"
                  value={formData.billingAddress.zip}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAddress: {
                        ...formData.billingAddress,
                        zip: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <Label htmlFor="notes">Order Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes about this order"
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || formData.orderItems.length === 0}>
          {loading ? 'Creating...' : 'Create Order'}
        </Button>
      </div>
    </form>
  )
}



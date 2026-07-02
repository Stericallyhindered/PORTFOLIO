import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { quantity, lowStockThreshold, trackInventory } = await request.json()

    // Validate input
    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return NextResponse.json({ error: 'Quantity must be a non-negative number' }, { status: 400 })
    }

    if (
      lowStockThreshold !== undefined &&
      (typeof lowStockThreshold !== 'number' || lowStockThreshold < 0)
    ) {
      return NextResponse.json(
        { error: 'Low stock threshold must be a non-negative number' },
        { status: 400 },
      )
    }

    if (trackInventory !== undefined && typeof trackInventory !== 'boolean') {
      return NextResponse.json({ error: 'Track inventory must be a boolean' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Build update data
    const updateData: any = {}

    if (quantity !== undefined) {
      updateData['inventory.quantity'] = quantity
    }

    if (lowStockThreshold !== undefined) {
      updateData['inventory.lowStockThreshold'] = lowStockThreshold
    }

    if (trackInventory !== undefined) {
      updateData['inventory.trackInventory'] = trackInventory
    }

    // Update the product
    const updatedProduct = await payload.update({
      collection: 'products',
      id: id,
      data: updateData,
      depth: 2,
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Error updating product inventory:', error)

    // Handle specific Payload errors
    if (error instanceof Error) {
      if (error.message.includes('No Product found')) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    return NextResponse.json({ error: 'Failed to update product inventory' }, { status: 500 })
  }
}

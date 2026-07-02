export async function getOrder(orderId: string, token: string | undefined) {
  // Validate orderId to prevent bad requests
  if (!orderId || orderId === 'undefined' || orderId === 'null') {
    console.error('Invalid order ID:', orderId)
    throw new Error('Invalid order ID')
  }

  // Clean the orderId to ensure it doesn't have problematic characters
  const cleanOrderId = encodeURIComponent(orderId.trim())

  try {
    // Check if order ID is a valid number for numeric lookup
    const isNumeric = /^\d+$/.test(orderId)

    // Try numeric ID lookup first if it's a number
    if (isNumeric) {
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${cleanOrderId}?depth=3&populate=items.product,items.product.shippingDetails`,
        {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
        },
      )

      if (orderResponse.ok) {
        const order = await orderResponse.json()
        return order
      }
    }

    // If numeric lookup fails or it's not a number, try UUID lookup
    const orderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${cleanOrderId}?uuidLookup=true&depth=3&populate=items.product,items.product.shippingDetails`,
      {
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      },
    )

    if (!orderResponse.ok) {
      if (orderResponse.status === 404) {
        throw new Error('Order not found')
      } else if (orderResponse.status === 403) {
        throw new Error('Unauthorized access')
      } else if (orderResponse.status === 400) {
        throw new Error('Invalid order ID format')
      } else {
        throw new Error(`Failed to fetch order: ${orderResponse.statusText}`)
      }
    }

    const order = await orderResponse.json()
    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  token: string | undefined,
) {
  // Validate orderId to prevent bad requests
  if (!orderId || orderId === 'undefined' || orderId === 'null') {
    console.error('Invalid order ID:', orderId)
    throw new Error('Invalid order ID')
  }

  // Clean the orderId to ensure it doesn't have problematic characters
  const cleanOrderId = encodeURIComponent(orderId.trim())

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${cleanOrderId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `JWT ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        credentials: 'include',
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Order not found')
      } else if (response.status === 403) {
        throw new Error('Unauthorized access')
      } else {
        throw new Error(`Failed to update order status: ${response.statusText}`)
      }
    }

    const updatedOrder = await response.json()
    return updatedOrder
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

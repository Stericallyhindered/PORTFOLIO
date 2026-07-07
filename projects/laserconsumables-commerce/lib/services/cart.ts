import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function getCart(customerId?: string) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('cart_session_id')?.value || generateSessionId()

  // Set cookie if new session
  if (!cookieStore.get('cart_session_id')) {
    cookieStore.set('cart_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  const cartItems = await prisma.cartItem.findMany({
    where: {
      OR: [
        { customerId: customerId || undefined },
        { sessionId: customerId ? undefined : sessionId },
      ],
    },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { position: 'asc' },
                take: 1,
              },
              collections: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.variant.price * item.quantity
  }, 0)

  return {
    items: cartItems,
    subtotal,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  }
}

export async function addToCart(
  variantId: string,
  quantity: number,
  customerId?: string
) {
  // Check inventory availability first
  const { checkInventoryAvailability } = await import('./inventory')
  const availability = await checkInventoryAvailability(variantId, quantity)

  if (!availability.available) {
    throw new Error(availability.message || 'Item not available')
  }

  const cookieStore = await cookies()
  const sessionId = cookieStore.get('cart_session_id')?.value || generateSessionId()

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      variantId,
      OR: [
        { customerId: customerId || undefined },
        { sessionId: customerId ? undefined : sessionId },
      ],
    },
  })

  if (existingItem) {
    // Update quantity
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { position: 'asc' },
                  take: 1,
                },
                collections: {
                  include: {
                    collection: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  // Create new cart item
  return await prisma.cartItem.create({
    data: {
      variantId,
      quantity,
      customerId: customerId || undefined,
      sessionId: customerId ? undefined : sessionId,
    },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { position: 'asc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  })
}

export async function updateCartItem(itemId: string, quantity: number) {
  if (quantity <= 0) {
    return await prisma.cartItem.delete({
      where: { id: itemId },
    })
  }

  return await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  })
}

export async function removeFromCart(itemId: string) {
  return await prisma.cartItem.delete({
    where: { id: itemId },
  })
}

export async function clearCart(customerId?: string) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('cart_session_id')?.value

  return await prisma.cartItem.deleteMany({
    where: {
      OR: [
        { customerId: customerId || undefined },
        { sessionId: customerId ? undefined : sessionId },
      ],
    },
  })
}


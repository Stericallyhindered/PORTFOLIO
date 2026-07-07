import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestOrder() {
  console.log('Creating test order...')

  // Get first product variant to use in order
  const variant = await prisma.productVariant.findFirst({
    include: { product: true }
  })

  if (!variant) {
    console.error('No product variants found. Please create products first.')
    process.exit(1)
  }

  console.log(`Using variant: ${variant.product.name} - ${variant.name || 'Default'}`)

  // Create the test order
  const order = await prisma.order.create({
    data: {
      orderNumber: `TEST-${Date.now()}`,
      email: 'test@laserconsumables.com',
      phone: '555-123-4567',
      status: 'PENDING',
      paymentStatus: 'PAID',
      subtotal: variant.price,
      tax: Math.round(variant.price * 0.0825), // 8.25% tax
      shipping: 999, // $9.99
      discount: 0,
      total: variant.price + Math.round(variant.price * 0.0825) + 999,
      notes: 'Test order for shipping label testing',
      items: {
        create: {
          variantId: variant.id,
          quantity: 1,
          price: variant.price,
        }
      },
      shippingAddress: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Company',
          address1: '123 Test Street',
          address2: 'Suite 100',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          country: 'US',
          phone: '555-123-4567',
        }
      },
      billingAddress: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Company',
          address1: '123 Test Street',
          address2: 'Suite 100',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          country: 'US',
          phone: '555-123-4567',
        }
      }
    },
    include: {
      items: true,
      shippingAddress: true,
      billingAddress: true,
    }
  })

  console.log('\n✅ Test order created successfully!')
  console.log('-----------------------------------')
  console.log(`Order ID: ${order.id}`)
  console.log(`Order Number: ${order.orderNumber}`)
  console.log(`Email: ${order.email}`)
  console.log(`Total: $${(order.total / 100).toFixed(2)}`)
  console.log(`Status: ${order.status}`)
  console.log(`Ship To: ${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}`)
  console.log(`Address: ${order.shippingAddress?.address1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zip}`)
  console.log('-----------------------------------')
  console.log('\nYou can now create a shipping label for this order in the admin panel.')
}

createTestOrder()
  .catch((error) => {
    console.error('Error creating test order:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('Cleaning up test data...')

  // Delete test orders
  const deletedOrders = await prisma.order.deleteMany({
    where: {
      orderNumber: { startsWith: 'TEST-' }
    }
  })
  console.log(`Deleted ${deletedOrders.count} test orders`)

  console.log('Cleanup complete!')
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@laserconsumables.com' },
    update: {},
    create: {
      email: 'admin@laserconsumables.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      adminProfile: {
        create: {},
      },
    },
    include: {
      adminProfile: true,
    },
  })

  console.log('Created admin user:', adminUser.email)

  // Create default collections
  const collections = [
    { name: 'Ceramic Rings', slug: 'ceramic-rings', description: 'High-quality ceramic rings for laser cutting', featured: true },
    { name: 'Laser Nozzles', slug: 'laser-nozzles', description: 'Precision laser nozzles', featured: true },
    { name: 'Protective Lenses', slug: 'protective-lenses', description: 'Protection windows and lenses', featured: true },
    { name: 'Stealth', slug: 'stealth', description: 'Stealth machine tools', featured: false },
    { name: 'Boci', slug: 'boci', description: 'Boci products', featured: false },
    { name: 'Bodor', slug: 'bodor', description: 'Bodor products', featured: false },
    { name: 'Precitec', slug: 'precitec', description: 'Precitec products', featured: false },
    { name: 'Accessories', slug: 'accessories', description: 'Laser accessories', featured: false },
  ]

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {},
      create: collection,
    })
  }

  console.log('Created collections')

  // Create default site settings
  const settings = [
    { key: 'site_name', value: 'Laser Consumables', type: 'string', group: 'general' },
    { key: 'site_description', value: 'Premium laser consumables and equipment', type: 'string', group: 'general' },
    { key: 'logo_url', value: '', type: 'image', group: 'appearance' },
    { key: 'primary_color', value: '#FF0000', type: 'string', group: 'appearance' },
    { key: 'currency', value: 'USD', type: 'string', group: 'general' },
    { key: 'tax_rate', value: '0', type: 'number', group: 'general' },
  ]

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('Created site settings')

  // Create default email templates
  const templates = [
    {
      name: 'order_confirmation',
      subject: 'Order Confirmation - {{orderNumber}}',
      body: 'Thank you for your order! Your order number is {{orderNumber}}.',
      bodyHtml: '<h1>Thank you for your order!</h1><p>Your order number is {{orderNumber}}.</p>',
      variables: JSON.stringify(['orderNumber', 'customerName', 'orderTotal', 'orderItems']),
    },
    {
      name: 'order_shipped',
      subject: 'Your Order Has Shipped - {{orderNumber}}',
      body: 'Your order {{orderNumber}} has been shipped. Tracking: {{trackingNumber}}',
      bodyHtml: '<h1>Your order has shipped!</h1><p>Order: {{orderNumber}}</p><p>Tracking: {{trackingNumber}}</p>',
      variables: JSON.stringify(['orderNumber', 'trackingNumber', 'carrier', 'estimatedDelivery']),
    },
    {
      name: 'welcome',
      subject: 'Welcome to Laser Consumables!',
      body: 'Welcome {{customerName}}! Thank you for joining us.',
      bodyHtml: '<h1>Welcome!</h1><p>Thank you for joining Laser Consumables, {{customerName}}!</p>',
      variables: JSON.stringify(['customerName']),
    },
  ]

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    })
  }

  console.log('Created email templates')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


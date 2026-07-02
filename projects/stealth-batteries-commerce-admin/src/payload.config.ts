// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { stripePlugin } from '@payloadcms/plugin-stripe'
import { resendAdapter } from '@payloadcms/email-resend'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import pkg from 'pg'
const { Pool } = pkg

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { ProductCategories } from './collections/ProductCategories'
import { Users } from './collections/Users'
import { Customers } from './collections/Customers'
import { Orders } from './collections/Orders'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { Admins } from './collections/Admins'
import { Dealers } from './collections/Dealers'
import { DiscountTiers } from './collections/DiscountTiers'
import { DiscountCodes } from './collections/DiscountCodes'
import { Affiliates } from './collections/Affiliates'
import { ShippingConfig } from './collections/ShippingConfig'
import { ShippingCarriers } from './collections/ShippingCarriers'
import { ShippingRateCache } from './collections/ShippingRateCache'
import { StealthEvents } from './collections/StealthEvents/index'
import { BulkDiscountLevels } from './collections/BulkDiscountLevels'
import { SalesReps } from './collections/SalesReps'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create the pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URI || '',
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
  },
}

// Create a single pool instance that can be reused
const pool = new Pool(poolConfig)

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// Add connect with retry
const connectWithRetry = async (retries = 5) => {
  try {
    const client = await pool.connect()
    client.release()
    console.log('Successfully connected to database')
  } catch (err) {
    if (retries === 0) {
      console.error('Failed to connect to database after all retries')
      throw err
    }
    console.log(`Failed to connect, retrying... (${retries} attempts left)`)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return connectWithRetry(retries - 1)
  }
}

// Initial connection attempt
connectWithRetry()

export default buildConfig({
  admin: {
    components: {
      graphics: {
        Icon: '/components/AdminIcon',
        Logo: '/components/AdminLogo',
      },
      beforeDashboard: ['/components/Dashboard'],
      beforeNavLinks: ['/components/AdminCustomNav'],
    },
    meta: {
      titleSuffix: ' | Stealth Batteries | Admin',
      icons: [
        {
          url: '/favicon.ico',
          fetchPriority: 'high',
          sizes: '16x16',
        },
      ],
    },
    importMap: {
      baseDir: path.resolve(__dirname),
    },
    user: Users.slug,
    theme: 'dark',
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  editor: defaultLexical,
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromName: 'Stealth Batteries',
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@stealthbatteries.com',
  }),
  db: postgresAdapter({
    pool: poolConfig,
    migrationDir: path.resolve(__dirname, './migrations'),
  }),
  collections: [
    Admins,
    Dealers,
    Pages,
    Posts,
    Products,
    Media,
    Categories,
    ProductCategories,
    Users,
    Customers,
    Orders,
    DiscountTiers,
    BulkDiscountLevels,
    DiscountCodes,
    Affiliates,
    ShippingConfig,
    ShippingCarriers,
    ShippingRateCache,
    StealthEvents,
    SalesReps,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      isTestKey: process.env.NODE_ENV !== 'production',
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
      rest: true,
      // @ts-expect-error - We know this works with the newer API version
      apiVersion: '2024-04-10',
      sync: [
        {
          collection: 'customers',
          stripeResourceType: 'customers',
          stripeResourceTypeSingular: 'customer',
          fields: [
            {
              fieldPath: 'name',
              stripeProperty: 'name',
            },
            {
              fieldPath: 'email',
              stripeProperty: 'email',
            },
            {
              fieldPath: 'phone',
              stripeProperty: 'phone',
            },
          ],
        },
      ],
    }),
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: {
          prefix: 'stealth-batteries/uploads',
          generateFileURL: ({ filename }) => {
            const baseURL = 'https://i1vip8txhmugx0q6.public.blob.vercel-storage.com'
            if (!filename) return `${baseURL}/stealth-batteries/uploads/default`
            return `${baseURL}/stealth-batteries/uploads/${filename}`
          },
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})

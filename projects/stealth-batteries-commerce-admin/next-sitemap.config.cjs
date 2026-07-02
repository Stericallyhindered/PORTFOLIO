//This is used in production and creates the sitemap.xml file

const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'https://stealthbatteries.com'

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  generateIndexSitemap: false, // Prevent creation of sitemap index
  outDir: 'public', // Ensure output directory is set
  exclude: [
    '/admin/*', // Admin routes
    '/dealer/*', // Private dealer routes
    '/dealer-login', // Auth pages
    '/dealer-register',
    '/create-account',
    '/verify-email',
    '/checkout/*', // Private checkout routes
    '/cart', // Cart page
    '/search', // Search page
    '/_providers/*', // Internal provider routes
    '/posts', // Remove old posts route
  ],
  // Add additional routes that should be included in the sitemap
  additionalPaths: async (config) => {
    const result = []

    // Add product category pages
    const productCategories = ['/products/batteries', '/products/accessories', '/products/swag']

    // Add main site pages
    const mainPages = [
      '/', // Homepage
      '/products', // Products main page
      '/find-dealer', // Dealer locator
      '/contact', // Contact page
      '/anglers-corner', // Anglers Corner
      '/stealth-angle', // Stealth Angle main
      '/stealth-angle/past-events', // Past events
      '/warranty', // Warranty page
      '/packaging-qr', // Packaging QR page
      '/legal/privacy-policy',
      '/legal/terms-of-service',
      '/legal/refund-policy', // Fixed: was return-policy
      '/legal/shipping-policy',
      '/legal/website-accessibility-statement', // Added missing page
    ]

    // Add product categories with higher priority
    for (const path of productCategories) {
      result.push({
        loc: path,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      })
    }

    // Add main pages
    for (const path of mainPages) {
      result.push({
        loc: path,
        changefreq: path.includes('events') ? 'weekly' : 'monthly',
        priority: path === '/' ? 1.0 : 0.7,
        lastmod: new Date().toISOString(),
      })
    }

    return result
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: [
          '/admin/*',
          '/dealer/*',
          '/dealer-login',
          '/dealer-register',
          '/create-account',
          '/sales-rep-login',
          '/sales-rep',
          '/verify-email',
          '/checkout/*',
          '/cart',
          '/search',
          '/_providers/*',
          '/posts',
        ],
      },
    ],
    additionalSitemaps: [
      `${SITE_URL}/sitemap.xml`, // Main sitemap
      `${SITE_URL}/products-sitemap.xml`, // Product pages
      `${SITE_URL}/pages-sitemap.xml`, // Dynamic pages from Payload
    ],
  },
}

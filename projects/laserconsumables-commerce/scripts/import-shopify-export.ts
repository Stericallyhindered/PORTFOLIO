/**
 * Comprehensive script to import ALL products and collections from Shopify HTML export
 * Run with: npx tsx scripts/import-shopify-export.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'node-html-parser'

const prisma = new PrismaClient()

interface ProductData {
  name: string
  slug: string
  description?: string
  price: number
  compareAtPrice?: number
  images: string[]
  vendor?: string
  type?: string
  collections: string[]
  variants: Array<{
    name?: string
    price: number
    compareAtPrice?: number
    sku?: string
    available?: boolean
  }>
}

async function extractProductFromHTML(filePath: string): Promise<ProductData | null> {
  try {
    const html = fs.readFileSync(filePath, 'utf-8')
    const root = parse(html)

    // Extract product name from title
    const title = root.querySelector('title')?.text || ''
    const name = title.split('–')[0].trim()

    // Extract slug from filename
    const slug = path.basename(filePath, '.html')

    // Extract description from meta or product description div
    let description = ''
    const metaDesc = root.querySelector('meta[name="description"]')
    if (metaDesc) {
      description = metaDesc.getAttribute('content') || ''
    }
    
    // Try to get full description from product description div
    const descDiv = root.querySelector('.product__description')
    if (descDiv) {
      description = descDiv.text.trim() || description
    }

    // Extract price from og:price:amount
    const priceMeta = root.querySelector('meta[property="og:price:amount"]')
    let price = priceMeta ? Math.round(parseFloat(priceMeta.getAttribute('content') || '0') * 100) : 0

    // Extract compare at price (sale price)
    let compareAtPrice: number | undefined
    const priceItem = root.querySelector('.price-item--regular')
    if (priceItem) {
      const priceText = priceItem.text.replace(/[^0-9.]/g, '')
      if (priceText) {
        compareAtPrice = Math.round(parseFloat(priceText) * 100)
      }
    }

    // Extract images - try multiple sources
    const images: string[] = []
    
    // From og:image
    const ogImage = root.querySelector('meta[property="og:image"]')
    if (ogImage) {
      const imageUrl = ogImage.getAttribute('content') || ''
      if (imageUrl && !images.includes(imageUrl)) {
        images.push(imageUrl)
      }
    }

    // From product media gallery
    const mediaImages = root.querySelectorAll('img[src*="cdn/shop"], img[data-src*="cdn/shop"]')
    mediaImages.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || ''
      if (src && src.includes('cdn/shop') && !images.includes(src)) {
        images.push(src)
      }
    })

    // Default variant - initialize before JSON-LD parsing
    let variants = [{
      name: name,
      price: price,
      compareAtPrice: compareAtPrice,
      sku: slug,
      available: true,
    }]

    // Extract vendor, type, and full product data from JSON-LD
    let vendor: string | undefined
    let type: string | undefined
    const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]')
    
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.text)
        if (data['@type'] === 'Product') {
          vendor = data.brand?.name || data.manufacturer?.name
          type = data.category || data.productType
          
          // Extract full description from JSON-LD if available
          if (data.description && !description) {
            description = data.description
          }
          
          // Extract ALL images from JSON-LD
          if (data.image) {
            if (Array.isArray(data.image)) {
              data.image.forEach((img: string) => {
                if (img && !images.includes(img)) {
                  images.push(img)
                }
              })
            } else if (typeof data.image === 'string') {
              if (!images.includes(data.image)) {
                images.push(data.image)
              }
            }
          }

          // Extract variants from offers
          if (data.offers) {
            const offers = Array.isArray(data.offers) ? data.offers : [data.offers]
            if (offers.length > 1) {
              // Multiple variants
              variants.length = 0 // Clear default variant
              offers.forEach((offer: any, index: number) => {
                if (offer.price) {
                  const variantPrice = Math.round(parseFloat(offer.price) * 100)
                  variants.push({
                    name: `${name} - Variant ${index + 1}`,
                    price: variantPrice,
                    compareAtPrice: undefined,
                    sku: `${slug}-v${index + 1}`,
                    available: offer.availability === 'http://schema.org/InStock',
                  })
                }
              })
            } else if (offers.length === 1 && offers[0].price) {
              // Single offer - update price
              price = Math.round(parseFloat(offers[0].price) * 100)
              variants[0].price = price
              variants[0].available = offers[0].availability === 'http://schema.org/InStock'
            }
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    // Extract collections from breadcrumbs or navigation
    const collections: string[] = []
    const breadcrumbs = root.querySelectorAll('nav[aria-label*="breadcrumb"] a, .breadcrumb a')
    breadcrumbs.forEach(link => {
      const href = link.getAttribute('href') || ''
      if (href.includes('/collections/')) {
        const collectionSlug = href.split('/collections/')[1]?.split('/')[0]
        if (collectionSlug && !collections.includes(collectionSlug)) {
          collections.push(collectionSlug)
        }
      }
    })

    return {
      name,
      slug,
      description,
      price,
      compareAtPrice,
      images: images.length > 0 ? images : [],
      vendor,
      type,
      collections,
      variants,
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return null
  }
}

async function extractCollectionFromHTML(filePath: string): Promise<{ name: string; slug: string; description?: string } | null> {
  try {
    const html = fs.readFileSync(filePath, 'utf-8')
    const root = parse(html)

    const title = root.querySelector('title')?.text || ''
    const name = title.split('–')[0].trim()
    const slug = path.basename(filePath, '.html')

    const metaDesc = root.querySelector('meta[name="description"]')
    const description = metaDesc?.getAttribute('content') || ''

    return { name, slug, description }
  } catch (error) {
    console.error(`Error parsing collection ${filePath}:`, error)
    return null
  }
}

async function linkProductsToCollections() {
  console.log('Linking products to collections...')
  
  // Method 1: From collection pages - find products in each collection
  const collectionsDir = path.join(process.cwd(), 'collections')
  const collectionFiles = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.html') && !f.includes('/'))
  
  let linked = 0

  for (const file of collectionFiles) {
    const filePath = path.join(collectionsDir, file)
    const collectionSlug = path.basename(filePath, '.html')
    
    try {
      const html = fs.readFileSync(filePath, 'utf-8')
      const root = parse(html)
      
      // Find product links in collection page
      const productLinks = root.querySelectorAll('a[href*="/products/"]')
      const productSlugs = new Set<string>()
      
      productLinks.forEach(link => {
        const href = link.getAttribute('href') || ''
        const match = href.match(/\/products\/([^\/\?]+)/)
        if (match && match[1]) {
          productSlugs.add(match[1])
        }
      })

      if (productSlugs.size > 0) {
        const collection = await prisma.collection.findUnique({
          where: { slug: collectionSlug },
        })

        if (collection) {
          for (const productSlug of productSlugs) {
            const product = await prisma.product.findUnique({
              where: { slug: productSlug },
            })

            if (product) {
              await prisma.productCollection.upsert({
                where: {
                  productId_collectionId: {
                    productId: product.id,
                    collectionId: collection.id,
                  },
                },
                create: {
                  productId: product.id,
                  collectionId: collection.id,
                },
                update: {},
              })
              linked++
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error linking collection ${collectionSlug}:`, error)
    }
  }

  // Method 2: From product pages - find collections in breadcrumbs
  const productsDir = path.join(process.cwd(), 'products')
  const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'))

  for (const file of productFiles) {
    const filePath = path.join(productsDir, file)
    const slug = path.basename(filePath, '.html')
    
    try {
      const html = fs.readFileSync(filePath, 'utf-8')
      const root = parse(html)
      
      // Find collection links in breadcrumbs or product info
      const collectionLinks = root.querySelectorAll('a[href*="/collections/"]')
      const collectionSlugs = new Set<string>()
      
      collectionLinks.forEach(link => {
        const href = link.getAttribute('href') || ''
        const match = href.match(/\/collections\/([^\/]+)/)
        if (match && match[1]) {
          collectionSlugs.add(match[1])
        }
      })

      if (collectionSlugs.size > 0) {
        const product = await prisma.product.findUnique({
          where: { slug },
        })

        if (product) {
          for (const collectionSlug of collectionSlugs) {
            const collection = await prisma.collection.findUnique({
              where: { slug: collectionSlug },
            })

            if (collection) {
              await prisma.productCollection.upsert({
                where: {
                  productId_collectionId: {
                    productId: product.id,
                    collectionId: collection.id,
                  },
                },
                create: {
                  productId: product.id,
                  collectionId: collection.id,
                },
                update: {},
              })
              linked++
            }
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  console.log(`Linked ${linked} product-collection relationships`)
}

async function importProducts() {
  console.log('Starting product import...')
  const productsDir = path.join(process.cwd(), 'products')
  const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'))

  let imported = 0
  let updated = 0
  let errors = 0

  for (const file of files) {
    const filePath = path.join(productsDir, file)
    const productData = await extractProductFromHTML(filePath)

    if (!productData) {
      errors++
      continue
    }

    try {
      // Check if product already exists
      const existing = await prisma.product.findUnique({
        where: { slug: productData.slug },
        include: { variants: true, images: true },
      })

      if (existing) {
        // Update existing product
        await prisma.product.update({
          where: { slug: productData.slug },
          data: {
            name: productData.name,
            description: productData.description || undefined,
            vendor: productData.vendor || undefined,
            type: productData.type || undefined,
            status: 'active', // Ensure it's active
            variants: {
              updateMany: existing.variants.map((v, i) => ({
                where: { id: v.id },
                data: {
                  price: productData.variants[i]?.price || v.price,
                  compareAtPrice: productData.variants[i]?.compareAtPrice || undefined,
                  sku: productData.variants[i]?.sku || v.sku,
                },
              })),
            },
            images: productData.images.length > 0 ? {
              deleteMany: {},
              create: productData.images.map((url, index) => ({
                url,
                position: index,
              })),
            } : undefined,
          },
        })
        console.log(`↻ Updated: ${productData.name}`)
        updated++
        continue
      }

      // Create new product
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          vendor: productData.vendor,
          type: productData.type,
          status: 'active',
          tags: '[]', // JSON array as string for SQLite
          variants: {
            create: productData.variants.map(v => ({
              name: v.name || productData.name,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              sku: v.sku || productData.slug,
              inventoryQuantity: 0,
            })),
          },
          images: productData.images.length > 0 ? {
            create: productData.images.map((url, index) => ({
              url,
              position: index,
            })),
          } : undefined,
        },
      })

      console.log(`✓ Imported: ${productData.name} (${productData.variants.length} variant(s), ${productData.images.length} image(s))`)
      imported++
    } catch (error) {
      console.error(`✗ Error importing ${productData.name}:`, error)
      errors++
    }
  }

  console.log(`\nProduct import complete: ${imported} imported, ${updated} updated, ${errors} errors`)
}

async function importCollections() {
  console.log('Starting collection import...')
  const collectionsDir = path.join(process.cwd(), 'collections')
  const files = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.html') && !f.includes('/'))

  let imported = 0
  let updated = 0
  let errors = 0

  for (const file of files) {
    const filePath = path.join(collectionsDir, file)
    const collectionData = await extractCollectionFromHTML(filePath)

    if (!collectionData) {
      errors++
      continue
    }

    try {
      const existing = await prisma.collection.findUnique({
        where: { slug: collectionData.slug },
      })

      if (existing) {
        await prisma.collection.update({
          where: { slug: collectionData.slug },
          data: {
            name: collectionData.name,
            description: collectionData.description || undefined,
          },
        })
        console.log(`↻ Updated collection: ${collectionData.name}`)
        updated++
        continue
      }

      await prisma.collection.create({
        data: {
          name: collectionData.name,
          slug: collectionData.slug,
          description: collectionData.description,
          featured: false,
        },
      })

      console.log(`✓ Imported collection: ${collectionData.name}`)
      imported++
    } catch (error) {
      console.error(`✗ Error importing collection ${collectionData.name}:`, error)
      errors++
    }
  }

  console.log(`\nCollection import complete: ${imported} imported, ${updated} updated, ${errors} errors`)
}

async function main() {
  try {
    console.log('🚀 Starting Shopify Import...\n')
    
    await importCollections()
    console.log('')
    await importProducts()
    console.log('')
    await linkProductsToCollections()
    
    console.log('\n✅ Import complete!')
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

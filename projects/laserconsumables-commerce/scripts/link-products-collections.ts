import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'node-html-parser'

const prisma = new PrismaClient()

async function linkProductsToCollections() {
  console.log('Linking products to collections...')
  
  const collectionsDir = path.join(process.cwd(), 'collections')
  const productsDir = path.join(process.cwd(), 'products')
  
  let linked = 0

  // Method 1: From collection HTML pages
  const collectionFiles = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.html') && !f.includes('/'))
  
  for (const file of collectionFiles) {
    const filePath = path.join(collectionsDir, file)
    const collectionSlug = path.basename(filePath, '.html')
    
    try {
      const html = fs.readFileSync(filePath, 'utf-8')
      const root = parse(html)
      
      // Find product links
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

  // Method 2: From product HTML pages - find collections in breadcrumbs
  const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'))

  for (const file of productFiles) {
    const filePath = path.join(productsDir, file)
    const slug = path.basename(filePath, '.html')
    
    try {
      const html = fs.readFileSync(filePath, 'utf-8')
      const root = parse(html)
      
      // Find collection links
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

  // Method 3: Link based on collection folder structure
  const collectionFolders = fs.readdirSync(collectionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  for (const folderName of collectionFolders) {
    const collectionSlug = folderName
    const productsInFolder = fs.readdirSync(path.join(collectionsDir, folderName, 'products'))
      .filter(f => f.endsWith('.html'))
      .map(f => path.basename(f, '.html'))

    const collection = await prisma.collection.findUnique({
      where: { slug: collectionSlug },
    })

    if (collection) {
      for (const productSlug of productsInFolder) {
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

  console.log(`Linked ${linked} product-collection relationships`)
}

async function main() {
  try {
    await linkProductsToCollections()
    console.log('\n✅ Linking complete!')
  } catch (error) {
    console.error('❌ Linking failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()



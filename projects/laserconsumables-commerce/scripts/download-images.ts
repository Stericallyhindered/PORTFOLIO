/**
 * Download all product images from Shopify and save locally
 * Run with: npx tsx scripts/download-images.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'node-html-parser'
import { PrismaClient } from '@prisma/client'
import https from 'https'
import http from 'http'

const prisma = new PrismaClient()

const PRODUCTS_DIR = path.join(process.cwd(), 'products')
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'products')

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

interface ImageInfo {
  url: string
  slug: string
  index: number
}

function extractImagesFromHTML(filePath: string): string[] {
  try {
    const html = fs.readFileSync(filePath, 'utf-8')
    const root = parse(html)
    const images: string[] = []

    // From og:image meta tag
    const ogImage = root.querySelector('meta[property="og:image"]')
    if (ogImage) {
      const url = ogImage.getAttribute('content')
      if (url && !images.includes(url)) {
        images.push(url)
      }
    }

    // From og:image:secure_url
    const secureImage = root.querySelector('meta[property="og:image:secure_url"]')
    if (secureImage) {
      const url = secureImage.getAttribute('content')
      if (url && !images.includes(url)) {
        images.push(url)
      }
    }

    // From JSON-LD
    const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]')
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.text)
        if (data['@type'] === 'Product' && data.image) {
          if (Array.isArray(data.image)) {
            data.image.forEach((img: string) => {
              if (img && !images.includes(img)) {
                images.push(img)
              }
            })
          } else if (typeof data.image === 'string' && !images.includes(data.image)) {
            images.push(data.image)
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    // From product gallery images
    const galleryImages = root.querySelectorAll('img[src*="cdn/shop"], img[data-src*="cdn/shop"]')
    galleryImages.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src')
      if (src && !images.includes(src)) {
        images.push(src)
      }
    })

    return images
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

function downloadImage(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure https
    let downloadUrl = url.replace(/^http:\/\//, 'https://')
    
    // Clean up URL (remove width/height params for full size)
    const urlObj = new URL(downloadUrl)
    urlObj.searchParams.delete('width')
    urlObj.searchParams.delete('height')
    downloadUrl = urlObj.toString()

    const protocol = downloadUrl.startsWith('https') ? https : http

    const file = fs.createWriteStream(filePath)
    
    protocol.get(downloadUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          file.close()
          fs.unlinkSync(filePath)
          downloadImage(redirectUrl, filePath).then(resolve).catch(reject)
          return
        }
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(filePath)
        reject(new Error(`HTTP ${response.statusCode} for ${downloadUrl}`))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      reject(err)
    })
  })
}

function getExtensionFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const ext = path.extname(pathname).toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return ext
    }
  } catch (e) {}
  return '.jpg' // Default to jpg
}

async function main() {
  console.log('Scanning product HTML files for images...\n')

  const productFiles = fs.readdirSync(PRODUCTS_DIR)
    .filter(f => f.endsWith('.html'))

  const allImages: ImageInfo[] = []
  const slugImageMap: Map<string, string[]> = new Map()

  // Extract all images from HTML files
  for (const file of productFiles) {
    const filePath = path.join(PRODUCTS_DIR, file)
    const slug = path.basename(file, '.html')
    const images = extractImagesFromHTML(filePath)
    
    if (images.length > 0) {
      slugImageMap.set(slug, images)
      images.forEach((url, index) => {
        allImages.push({ url, slug, index })
      })
    }
  }

  console.log(`Found ${allImages.length} images from ${slugImageMap.size} products\n`)

  // Download images
  let downloaded = 0
  let errors = 0
  const urlToLocalPath: Map<string, string> = new Map()

  for (const img of allImages) {
    const ext = getExtensionFromUrl(img.url)
    const filename = `${img.slug}-${img.index}${ext}`
    const localPath = path.join(IMAGES_DIR, filename)
    const webPath = `/images/products/${filename}`

    // Skip if already downloaded
    if (fs.existsSync(localPath)) {
      console.log(`⏭ Skipped (exists): ${filename}`)
      urlToLocalPath.set(img.url, webPath)
      downloaded++
      continue
    }

    try {
      await downloadImage(img.url, localPath)
      urlToLocalPath.set(img.url, webPath)
      console.log(`✓ Downloaded: ${filename}`)
      downloaded++
    } catch (error: any) {
      console.error(`✗ Failed: ${filename} - ${error.message}`)
      errors++
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\nDownloaded ${downloaded} images, ${errors} errors\n`)

  // Update database with local paths
  console.log('Updating database with local image paths...\n')

  let updated = 0
  for (const [originalUrl, localPath] of urlToLocalPath) {
    // Also match http version
    const httpUrl = originalUrl.replace(/^https:\/\//, 'http://')
    
    try {
      const result = await prisma.productImage.updateMany({
        where: {
          OR: [
            { url: originalUrl },
            { url: httpUrl },
            { url: { contains: originalUrl.split('?')[0] } },
          ]
        },
        data: {
          url: localPath
        }
      })
      if (result.count > 0) {
        updated += result.count
      }
    } catch (e) {
      // Ignore errors for URLs not in database
    }
  }

  console.log(`Updated ${updated} image records in database`)

  await prisma.$disconnect()
  console.log('\n✅ Image download complete!')
}

main().catch(console.error)

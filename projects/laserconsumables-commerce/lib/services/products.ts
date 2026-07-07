import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export interface CreateProductData {
  name: string
  slug: string
  description?: string
  vendor?: string
  type?: string
  status?: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  variants: Array<{
    sku?: string
    name?: string
    price: number
    compareAtPrice?: number
    cost?: number
    inventoryQuantity?: number
    option1?: string
    option2?: string
    option3?: string
    weight?: number
    weightUnit?: string
  }>
  images: Array<{
    url: string
    alt?: string
    position?: number
  }>
  collectionIds?: string[]
}

export async function createProduct(data: CreateProductData) {
  const { variants, images, collectionIds, tags, ...productData } = data

  return await prisma.product.create({
    data: {
      ...productData,
      tags: tags ? JSON.stringify(tags) : '[]',
      variants: {
        create: variants.map((v) => ({
          ...v,
          price: Math.round(v.price * 100), // Convert to cents
          compareAtPrice: v.compareAtPrice ? Math.round(v.compareAtPrice * 100) : null,
          cost: v.cost ? Math.round(v.cost * 100) : null,
        })),
      },
      images: {
        create: images.map((img, index) => ({
          url: img.url,
          alt: img.alt || '',
          position: img.position ?? index,
        })),
      },
      collections: collectionIds
        ? {
            create: collectionIds.map((collectionId) => ({
              collectionId,
            })),
          }
        : undefined,
    },
    include: {
      variants: true,
      images: {
        orderBy: { position: 'asc' },
      },
      collections: {
        include: {
          collection: true,
        },
      },
    },
  })
}

export async function updateProduct(id: string, data: Partial<CreateProductData>) {
  const { variants, images, collectionIds, tags, ...productData } = data

  // Update product
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
    },
  })

  // Update variants if provided
  if (variants) {
    // Delete existing variants
    await prisma.productVariant.deleteMany({
      where: { productId: id },
    })

    // Create new variants
    await prisma.productVariant.createMany({
      data: variants.map((v) => ({
        productId: id,
        ...v,
        price: Math.round(v.price * 100),
        compareAtPrice: v.compareAtPrice ? Math.round(v.compareAtPrice * 100) : null,
        cost: v.cost ? Math.round(v.cost * 100) : null,
      })),
    })
  }

  // Update images if provided
  if (images) {
    // Delete existing images
    await prisma.productImage.deleteMany({
      where: { productId: id },
    })

    // Create new images
    await prisma.productImage.createMany({
      data: images.map((img, index) => ({
        productId: id,
        url: img.url,
        alt: img.alt || '',
        position: img.position ?? index,
      })),
    })
  }

  // Update collections if provided
  if (collectionIds) {
    // Delete existing collections
    await prisma.productCollection.deleteMany({
      where: { productId: id },
    })

    // Create new collections
    await prisma.productCollection.createMany({
      data: collectionIds.map((collectionId) => ({
        productId: id,
        collectionId,
      })),
    })
  }

  return await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      images: {
        orderBy: { position: 'asc' },
      },
      collections: {
        include: {
          collection: true,
        },
      },
    },
  })
}

export async function getProducts(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  collectionId?: string
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const skip = (page - 1) * limit

  const where: Prisma.ProductWhereInput = {}

  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
      { tags: { contains: params.search } }, // SQLite: tags is JSON string, use contains
    ]
  }

  if (params?.status) {
    where.status = params.status
  }

  if (params?.collectionId) {
    where.collections = {
      some: {
        collectionId: params.collectionId,
      },
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        variants: {
          orderBy: { price: 'asc' },
        },
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
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getProduct(id: string) {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { price: 'asc' },
      },
      images: {
        orderBy: { position: 'asc' },
      },
      collections: {
        include: {
          collection: true,
        },
      },
    },
  })
}

export async function getProductBySlug(slug: string) {
  return await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: {
        orderBy: { price: 'asc' },
      },
      images: {
        orderBy: { position: 'asc' },
      },
      collections: {
        include: {
          collection: true,
        },
      },
    },
  })
}

export async function deleteProduct(id: string) {
  return await prisma.product.delete({
    where: { id },
  })
}

export async function getCollections() {
  return await prisma.collection.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getCollectionBySlug(slug: string) {
  return await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            include: {
              variants: {
                orderBy: { price: 'asc' },
              },
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


import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, blogPosts, users } from '@/lib/db'
import { eq, desc, asc, and, or, like, count } from 'drizzle-orm'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

// Helper: treat empty strings as undefined so optional URL fields don't fail validation
const emptyToUndefined = z.literal('').transform(() => undefined);
const optionalUrl = z.union([emptyToUndefined, z.string().url()]).optional();
const optionalString = (max: number) => z.union([emptyToUndefined, z.string().max(max)]).optional();

const createBlogPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(255, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  excerpt: optionalString(500),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  featuredImage: optionalUrl,
  images: z.array(z.string().url('Invalid image URL')).optional(),
  videos: z.array(z.object({
    url: z.string().url('Invalid video URL'),
    title: z.union([emptyToUndefined, z.string()]).optional(),
    thumbnail: z.union([emptyToUndefined, z.string().url()]).optional()
  })).optional(),
  category: optionalString(100),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false),
  publishedAt: z.string().datetime('Invalid published date').optional().nullable(),
  featured: z.boolean().default(false),
  seoTitle: optionalString(255),
  seoDescription: optionalString(500),
  metaKeywords: z.array(z.string()).optional()
})

export const dynamic = 'force-dynamic';

// GET - List blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const published = searchParams.get('published') !== 'false' // default to true for public
    const featured = searchParams.get('featured') === 'true'
    const sortBy = searchParams.get('sortBy') || 'publishedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query conditions
    const conditions = []
    
    if (published) {
      conditions.push(eq(blogPosts.published, true))
    }
    
    if (featured) {
      conditions.push(eq(blogPosts.featured, true))
    }
    
    if (category) {
      conditions.push(eq(blogPosts.category, category))
    }
    
    if (search) {
      conditions.push(
        or(
          like(blogPosts.title, `%${search}%`),
          like(blogPosts.excerpt, `%${search}%`),
          like(blogPosts.content, `%${search}%`)
        )
      )
    }

    // Build sort order
    const sortColumn = sortBy === 'title' ? blogPosts.title :
                      sortBy === 'publishedAt' ? blogPosts.publishedAt :
                      sortBy === 'createdAt' ? blogPosts.createdAt :
                      blogPosts.publishedAt
    
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

    // Get blog posts with pagination
    const offset = (page - 1) * limit
    const postsQuery = db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        images: blogPosts.images,
        videos: blogPosts.videos,
        category: blogPosts.category,
        tags: blogPosts.tags,
        authorId: blogPosts.authorId,
        authorName: blogPosts.authorName,
        published: blogPosts.published,
        publishedAt: blogPosts.publishedAt,
        featured: blogPosts.featured,
        views: blogPosts.views,
        seoTitle: blogPosts.seoTitle,
        seoDescription: blogPosts.seoDescription,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        creatorName: users.name
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    const postsList = await postsQuery

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count(blogPosts.id) })
      .from(blogPosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const totalPages = Math.ceil(totalCount.count / limit)

    return successResponse({
      posts: postsList,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Blog posts retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create blog post
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = createBlogPostSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const postData = validation.data

    // Check if slug already exists
    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, postData.slug))
      .limit(1)

    if (existingPost) {
      return validationErrorResponse({ slug: ['Slug already exists'] })
    }

    // Get author name
    const [author] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    // Create blog post
    const [newPost] = await db
      .insert(blogPosts)
      .values({
        ...postData,
        authorId: user.id,
        authorName: author?.name || user.name || 'Admin',
        publishedAt: postData.published && postData.publishedAt 
          ? new Date(postData.publishedAt) 
          : postData.published 
            ? new Date() 
            : null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    return successResponse(newPost, 'Blog post created successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

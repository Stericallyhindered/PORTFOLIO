import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, blogPosts, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, notFoundResponse, handleApiError } from '@/lib/api-response'

const updateBlogPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long').optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(255, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  featuredImage: z.string().url('Invalid featured image URL').optional().nullable(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  videos: z.array(z.object({
    url: z.string().url('Invalid video URL'),
    title: z.string().optional(),
    thumbnail: z.string().url('Invalid thumbnail URL').optional()
  })).optional(),
  category: z.string().max(100, 'Category is too long').optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().datetime('Invalid published date').optional().nullable(),
  featured: z.boolean().optional(),
  seoTitle: z.string().max(255, 'SEO title is too long').optional().nullable(),
  seoDescription: z.string().max(500, 'SEO description is too long').optional().nullable(),
  metaKeywords: z.array(z.string()).optional()
})

export const dynamic = 'force-dynamic';

// GET - Get single blog post
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if it's a slug or UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    const [post] = await db
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
        metaKeywords: blogPosts.metaKeywords,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        creatorName: users.name
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(isUUID ? eq(blogPosts.id, id) : eq(blogPosts.slug, id))
      .limit(1)

    if (!post) {
      return notFoundResponse('Blog post not found')
    }

    // Increment views if published
    if (post.published) {
      await db
        .update(blogPosts)
        .set({ views: (post.views || 0) + 1 })
        .where(eq(blogPosts.id, post.id))
    }

    return successResponse(post, 'Blog post retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update blog post
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = updateBlogPostSchema.strip().safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const updateData = validation.data

    // Check if post exists
    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1)

    if (!existingPost) {
      return notFoundResponse('Blog post not found')
    }

    // Check if slug is being changed and if new slug exists
    if (updateData.slug && updateData.slug !== existingPost.slug) {
      const [slugExists] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, updateData.slug))
        .limit(1)

      if (slugExists) {
        return validationErrorResponse({ slug: ['Slug already exists'] })
      }
    }

    // Prepare update data
    const updateValues: any = { ...updateData }
    
    if (updateData.publishedAt !== undefined) {
      updateValues.publishedAt = updateData.publishedAt ? new Date(updateData.publishedAt) : null
    } else if (updateData.published && !existingPost.publishedAt) {
      // Auto-set publishedAt if publishing for first time
      updateValues.publishedAt = new Date()
    }

    updateValues.updatedAt = new Date()

    // Update blog post
    const [updatedPost] = await db
      .update(blogPosts)
      .set(updateValues)
      .where(eq(blogPosts.id, id))
      .returning()

    return successResponse(updatedPost, 'Blog post updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await requireAdmin(request)

    // Check if post exists
    const [existingPost] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1)

    if (!existingPost) {
      return notFoundResponse('Blog post not found')
    }

    // Delete blog post
    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))

    return successResponse(null, 'Blog post deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

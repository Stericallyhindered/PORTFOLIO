import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { portfolioVideos } from '@/lib/db/schema'
import { eq, desc, and, asc } from 'drizzle-orm'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const published = searchParams.get('published') !== 'false' // default to true

    // Apply filters
    const conditions = []
    if (published) {
      conditions.push(eq(portfolioVideos.published, true))
    }
    if (featured) {
      conditions.push(eq(portfolioVideos.featured, true))
    }
    if (category) {
      conditions.push(eq(portfolioVideos.category, category))
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Execute query with entire chain built at once (conditional orderBy)
    const videos = featured
      ? await db
          .select()
          .from(portfolioVideos)
          .where(whereClause)
          .orderBy(
            asc(portfolioVideos.featuredOrder),
            asc(portfolioVideos.displayOrder),
            desc(portfolioVideos.createdAt)
          )
          .limit(limit)
      : await db
          .select()
          .from(portfolioVideos)
          .where(whereClause)
          .orderBy(
            asc(portfolioVideos.displayOrder),
            desc(portfolioVideos.createdAt)
          )
          .limit(limit)

    return successResponse({ videos }, 'Portfolio videos fetched successfully')
  } catch (error) {
    return handleApiError(error)
  }
}


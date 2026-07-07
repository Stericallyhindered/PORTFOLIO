import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db, contests, users } from '@/lib/db'
import { eq, desc, asc, and, or, like, gte, lte, count } from 'drizzle-orm'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

const createContestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().max(500, 'Short description is too long').optional(),
  image: z.string().url('Invalid image URL').optional(),
  brandLogo: z.string().optional(),
  brandName: z.string().max(255, 'Brand name is too long').optional(),
  prize: z.string().min(1, 'Prize is required').max(255, 'Prize description is too long'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  applicationDeadline: z.string().datetime('Invalid application deadline'),
  submissionDeadline: z.string().datetime('Invalid submission deadline'),
  category: z.string().min(1, 'Category is required').max(100, 'Category is too long'),
  requirements: z.array(z.string()).optional(),
  judges: z.array(z.string()).optional(),
  maxParticipants: z.number().int().positive('Max participants must be positive').optional(),
  rules: z.string().optional(),
  submissionGuidelines: z.string().optional()
})

export const dynamic = 'force-dynamic';

// GET - List contests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query conditions
    const conditions = []
    
    if (status) {
      conditions.push(eq(contests.status, status))
    }
    
    if (category) {
      conditions.push(eq(contests.category, category))
    }
    
    if (search) {
      conditions.push(
        or(
          like(contests.title, `%${search}%`),
          like(contests.description, `%${search}%`)
        )
      )
    }

    // Build sort order
    const sortColumn = sortBy === 'title' ? contests.title :
                      sortBy === 'startDate' ? contests.startDate :
                      sortBy === 'endDate' ? contests.endDate :
                      contests.createdAt
    
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

    // Get contests with pagination
    const offset = (page - 1) * limit
    const contestsQuery = db
      .select({
        id: contests.id,
        title: contests.title,
        description: contests.description,
        shortDescription: contests.shortDescription,
        image: contests.image,
        brandLogo: contests.brandLogo,
        brandName: contests.brandName,
        prize: contests.prize,
        startDate: contests.startDate,
        endDate: contests.endDate,
        applicationDeadline: contests.applicationDeadline,
        submissionDeadline: contests.submissionDeadline,
        status: contests.status,
        category: contests.category,
        requirements: contests.requirements,
        judges: contests.judges,
        maxParticipants: contests.maxParticipants,
        currentParticipants: contests.currentParticipants,
        rules: contests.rules,
        submissionGuidelines: contests.submissionGuidelines,
        createdBy: contests.createdBy,
        createdAt: contests.createdAt,
        updatedAt: contests.updatedAt,
        creatorName: users.name
      })
      .from(contests)
      .leftJoin(users, eq(contests.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    const contestsList = await contestsQuery

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: count(contests.id) })
      .from(contests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const totalCount = totalCountResult?.count ?? 0
    const totalPages = Math.ceil(totalCount / limit)

    return successResponse({
      contests: contestsList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 'Contests retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create contest
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = createContestSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const contestData = validation.data

    // Additional validation
    const startDate = new Date(contestData.startDate)
    const endDate = new Date(contestData.endDate)
    const applicationDeadline = new Date(contestData.applicationDeadline)
    const submissionDeadline = new Date(contestData.submissionDeadline)

    if (startDate >= endDate) {
      return validationErrorResponse({ endDate: ['End date must be after start date'] })
    }

    if (applicationDeadline >= submissionDeadline) {
      return validationErrorResponse({ 
        submissionDeadline: ['Submission deadline must be after application deadline'] 
      })
    }

    if (submissionDeadline >= endDate) {
      return validationErrorResponse({ 
        submissionDeadline: ['Submission deadline must be before end date'] 
      })
    }

    // Create contest
    const [newContest] = await db
      .insert(contests)
      .values({
        ...contestData,
        startDate,
        endDate,
        applicationDeadline,
        submissionDeadline,
        createdBy: user.id,
        status: 'draft'
      })
      .returning()

    return successResponse(newContest, 'Contest created successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 
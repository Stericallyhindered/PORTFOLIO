import { NextRequest } from 'next/server'
import { db, contests, contestApplications, contestSubmissions, users } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

// GET - Get all contest applications and submissions for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get all applications for the user with contest details
    const userApplications = await db
      .select({
        application: contestApplications,
        contest: contests
      })
      .from(contestApplications)
      .innerJoin(contests, eq(contestApplications.contestId, contests.id))
      .where(eq(contestApplications.userId, user.id))
      .orderBy(desc(contestApplications.createdAt))

    // Get all submissions for the user with contest details
    const userSubmissions = await db
      .select({
        submission: contestSubmissions,
        contest: contests,
        application: contestApplications
      })
      .from(contestSubmissions)
      .innerJoin(contests, eq(contestSubmissions.contestId, contests.id))
      .leftJoin(contestApplications, eq(contestSubmissions.applicationId, contestApplications.id))
      .where(eq(contestSubmissions.userId, user.id))
      .orderBy(desc(contestSubmissions.createdAt))

    // Transform applications to match ContestApplication type
    const applications = userApplications.map(({ application, contest }) => ({
      id: application.id,
      contestId: application.contestId,
      userId: application.userId,
      userEmail: user.email,
      userName: user.name || user.email,
      applicationDate: application.createdAt instanceof Date     
        ? application.createdAt.toISOString()
        : application.createdAt 
          ? new Date(application.createdAt).toISOString()
          : new Date().toISOString(),
      status: application.status || 'pending',
      responses: typeof application.responses === 'object' && application.responses !== null
        ? application.responses
        : {},
      rejectionReason: application.rejectionReason || undefined,
      reviewedBy: application.reviewedBy || undefined,
      reviewedAt: application.reviewedAt 
        ? (application.reviewedAt instanceof Date 
          ? application.reviewedAt.toISOString() 
          : new Date(application.reviewedAt).toISOString())
        : undefined,
      contest: {
        id: contest.id,
        title: contest.title,
        description: contest.description || '',
        shortDescription: contest.shortDescription || contest.description?.substring(0, 100) || '',
        image: contest.image || '/images/assets/bass-clown-co-fish-chase.png',
        prize: contest.prize || 'Prize TBD',
        startDate: contest.startDate instanceof Date 
          ? contest.startDate.toISOString().split('T')[0] 
          : new Date(contest.startDate).toISOString().split('T')[0],
        endDate: contest.endDate instanceof Date 
          ? contest.endDate.toISOString().split('T')[0] 
          : new Date(contest.endDate).toISOString().split('T')[0],
        applicationDeadline: contest.applicationDeadline instanceof Date 
          ? contest.applicationDeadline.toISOString().split('T')[0] 
          : new Date(contest.applicationDeadline).toISOString().split('T')[0],
        submissionDeadline: contest.submissionDeadline instanceof Date 
          ? contest.submissionDeadline.toISOString().split('T')[0] 
          : new Date(contest.submissionDeadline).toISOString().split('T')[0],
        status: contest.status || 'open',
        category: contest.category || 'General'
      }
    }))

    // Transform submissions to match ContestSubmission type
    const submissions = userSubmissions.map(({ submission, contest, application }) => ({
      id: submission.id,
      contestId: submission.contestId,
      applicationId: submission.applicationId || undefined,
      userId: submission.userId,
      title: submission.title || 'Untitled Submission',
      description: submission.description || '',
      fileUrl: submission.fileUrl || '',
      fileType: submission.fileType || 'unknown',
      status: submission.status || 'submitted',
      score: submission.score ? Number(submission.score) : undefined,
      feedback: submission.feedback || undefined,
      judgeNotes: submission.judgeNotes || undefined,
      submissionDate: submission.createdAt instanceof Date      
        ? submission.createdAt.toISOString()
        : submission.createdAt 
          ? new Date(submission.createdAt).toISOString()
          : new Date().toISOString(),
      contest: {
        id: contest.id,
        title: contest.title,
        description: contest.description || '',
        shortDescription: contest.shortDescription || contest.description?.substring(0, 100) || '',
        image: contest.image || '/images/assets/bass-clown-co-fish-chase.png',
        prize: contest.prize || 'Prize TBD',
        startDate: contest.startDate instanceof Date 
          ? contest.startDate.toISOString().split('T')[0] 
          : new Date(contest.startDate).toISOString().split('T')[0],
        endDate: contest.endDate instanceof Date 
          ? contest.endDate.toISOString().split('T')[0] 
          : new Date(contest.endDate).toISOString().split('T')[0],
        applicationDeadline: contest.applicationDeadline instanceof Date 
          ? contest.applicationDeadline.toISOString().split('T')[0] 
          : new Date(contest.applicationDeadline).toISOString().split('T')[0],
        submissionDeadline: contest.submissionDeadline instanceof Date 
          ? contest.submissionDeadline.toISOString().split('T')[0] 
          : new Date(contest.submissionDeadline).toISOString().split('T')[0],
        status: contest.status || 'open',
        category: contest.category || 'General'
      }
    }))

    // Get unique contests that user has interacted with
    const contestIds = new Set([
      ...applications.map(a => a.contestId),
      ...submissions.map(s => s.contestId)
    ])

    return successResponse({
      applications,
      submissions,
      contestIds: Array.from(contestIds)
    }, 'User contest data retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}


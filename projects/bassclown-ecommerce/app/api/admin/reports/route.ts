import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response';
import { reportsService } from '@/lib/reports-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const generateReportSchema = z.object({
  type: z.string(),
  format: z.enum(['pdf', 'excel', 'csv']).optional().default('pdf'),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }).optional(),
  filters: z.object({
    contestId: z.string().uuid().optional(),
    giveawayId: z.string().uuid().optional(),
    userRole: z.string().optional(),
    status: z.string().optional()
  }).optional()
})

// GET - Get generated reports list
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    
    // For now, return empty list - reports would be stored in database in production
    // TODO: Implement report storage/retrieval from database
    return successResponse({
      reports: []
    }, 'Reports retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Generate a new report
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = generateReportSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { type, format = 'pdf', dateRange, filters } = validation.data

    // Convert date strings to Date objects
    const reportFilters: any = {
      startDate: dateRange?.from ? new Date(dateRange.from) : undefined,
      endDate: dateRange?.to ? new Date(dateRange.to) : undefined,
      contestId: filters?.contestId,
      giveawayId: filters?.giveawayId,
      userRole: filters?.userRole,
      status: filters?.status
    }

    // Generate report using reports service
    const report = await reportsService.generateAdminReport(reportFilters, format as 'pdf' | 'excel')

    return successResponse({
      reportId: report.fileName.replace(/\.(pdf|excel|xlsx|csv)$/, ''),
      fileName: report.fileName,
      filePath: report.filePath,
      format,
      type,
      generatedAt: new Date().toISOString()
    }, 'Report generated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

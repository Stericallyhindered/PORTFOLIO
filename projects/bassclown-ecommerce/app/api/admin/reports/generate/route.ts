import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { reportsService } from '@/lib/reports-service'
import { successResponse, validationErrorResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

const generateReportSchema = z.object({
  reportType: z.enum(['admin', 'user', 'contest', 'giveaway', 'platform']),
  format: z.enum(['pdf', 'csv']).default('pdf'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  filters: z.record(z.any()).optional()
})

// POST - Generate a report
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request)
    const body = await request.json()

    // Validate input
    const validation = generateReportSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten().fieldErrors)
    }

    const { reportType, format, startDate, endDate, filters } = validation.data

    // Build filters
    const reportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      ...filters
    }

    let result: { filePath: string; fileName: string; url?: string };

    // Generate report based on type
    switch (reportType) {
      case 'admin':
        // Map csv to excel for admin reports
        const adminFormat = format === 'csv' ? 'excel' : format;
        result = await reportsService.generateAdminReport(reportFilters, adminFormat as 'pdf' | 'excel');
        break;
      case 'user':
        const userReport = await reportsService.generateUserReport(reportFilters);
        // Convert to CSV/PDF
        result = format === 'csv' 
          ? await reportsService.generateUserReportCSV(userReport)
          : await reportsService.generateUserReportPDF(userReport);
        break;
      case 'contest':
        const contestReport = await reportsService.generateContestReport(reportFilters);
        result = format === 'csv'
          ? await reportsService.generateContestReportCSV(contestReport)
          : await reportsService.generateContestReportPDF(contestReport);
        break;
      default:
        // Map csv to excel for admin reports
        const defaultFormat = format === 'csv' ? 'excel' : format;
        result = await reportsService.generateAdminReport(reportFilters, defaultFormat as 'pdf' | 'excel');
    }

    return successResponse({
      report: {
        fileName: result.fileName,
        url: result.url,
        format,
        reportType,
        generatedAt: new Date().toISOString(),
        generatedBy: adminUser.id
      }
    }, 'Report generated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}


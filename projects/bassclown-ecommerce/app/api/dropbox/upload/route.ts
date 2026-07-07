import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse, handleApiError } from '@/lib/api-response';
import { createDropboxSyncService } from '@/lib/dropbox-sync';

const uploadRequestSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  dropboxPath: z.string().min(1, 'Dropbox path is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  refreshToken: z.string().optional()
});

export const dynamic = 'force-dynamic';

// POST - Upload file to Dropbox
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validate input
    const validation = uploadRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return validationErrorResponse(errors);
    }

    const {
      fileId,
      dropboxPath,
      accessToken,
      clientId,
      clientSecret,
      refreshToken
    } = validation.data;

    // Create Dropbox sync service
    const dropboxService = createDropboxSyncService({
      accessToken,
      clientId,
      clientSecret,
      refreshToken
    });

    // Upload file to Dropbox
    await dropboxService.uploadToDropbox(user.id, fileId, dropboxPath);

    return successResponse({
      fileId,
      dropboxPath,
      message: 'File uploaded to Dropbox successfully'
    }, 'Upload completed');

  } catch (error) {
    return handleApiError(error);
  }
} 
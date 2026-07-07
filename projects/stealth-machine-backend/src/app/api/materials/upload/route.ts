import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadFile, validateFile, getFileTypeCategory } from '@/lib/storage';
import { successResponse, errorResponse } from '@/lib/utils';

// POST /api/materials/upload - Upload file to Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
    if ('error' in authResult) {
      return errorResponse(authResult.error, authResult.status);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Determine file type category
    const fileCategory = getFileTypeCategory(file.type);
    
    // Validate file
    const validation = validateFile(
      file,
      fileCategory as 'video' | 'image' | 'pdf' | 'document'
    );
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;

    // Upload to Vercel Blob
    const result = await uploadFile(file, {
      filename,
      folder: folder || 'materials',
      contentType: file.type,
    });

    return successResponse({
      url: result.url,
      pathname: result.pathname,
      filename: file.name,
      size: result.size,
      contentType: result.contentType,
      fileType: fileCategory,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('File upload failed', 500);
  }
}

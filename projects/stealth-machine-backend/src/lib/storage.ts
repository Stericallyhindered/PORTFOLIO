import { put, del, list } from '@vercel/blob';

// =============================================================================
// File Upload to Vercel Blob
// =============================================================================

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export async function uploadFile(
  file: File | Blob,
  options: {
    filename: string;
    folder?: string;
    contentType?: string;
  }
): Promise<UploadResult> {
  const pathname = options.folder 
    ? `${options.folder}/${options.filename}`
    : options.filename;

  const blob = await put(pathname, file, {
    access: 'public',
    contentType: options.contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType || 'application/octet-stream',
    size: file.size,
  };
}

// =============================================================================
// Delete File
// =============================================================================

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

// =============================================================================
// List Files
// =============================================================================

export async function listFiles(options?: {
  prefix?: string;
  limit?: number;
  cursor?: string;
}): Promise<{
  blobs: Array<{
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
  }>;
  cursor?: string;
  hasMore: boolean;
}> {
  const result = await list({
    prefix: options?.prefix,
    limit: options?.limit,
    cursor: options?.cursor,
  });

  return {
    blobs: result.blobs,
    cursor: result.cursor,
    hasMore: result.hasMore,
  };
}

// =============================================================================
// Get File Type Category
// =============================================================================

export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  return 'document';
}

// =============================================================================
// Generate Thumbnail (placeholder - would need external service)
// =============================================================================

export async function generateThumbnail(
  videoUrl: string
): Promise<string | null> {
  // In production, this would use a service like:
  // - Vercel OG Image
  // - Cloudinary
  // - Custom FFmpeg Lambda
  // For now, return null - thumbnails can be uploaded separately
  return null;
}

// =============================================================================
// Validate File
// =============================================================================

export interface FileValidation {
  valid: boolean;
  error?: string;
}

const ALLOWED_TYPES: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

const MAX_SIZES: Record<string, number> = {
  video: 500 * 1024 * 1024, // 500MB
  image: 10 * 1024 * 1024,   // 10MB
  pdf: 50 * 1024 * 1024,     // 50MB
  document: 50 * 1024 * 1024, // 50MB
};

export function validateFile(
  file: File,
  category: 'video' | 'image' | 'pdf' | 'document'
): FileValidation {
  const allowedTypes = ALLOWED_TYPES[category];
  const maxSize = MAX_SIZES[category];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}

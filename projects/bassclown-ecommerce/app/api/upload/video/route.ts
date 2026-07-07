import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { db, fileUploads } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return errorResponse('Filename is required', 400)
    }

    // Validate file extension
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    
    if (!allowedExtensions.includes(fileExtension)) {
      return errorResponse(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`, 400)
    }

    // Get file from request body
    if (!request.body) {
      return errorResponse('No file data provided', 400)
    }

    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const uniqueFilename = `videos/${user.id}/${timestamp}_${filename}`

    try {
      // Upload to Vercel Blob
      const blob = await put(uniqueFilename, request.body, {
        access: 'public',
        addRandomSuffix: false
      })

      // Get file size from the blob (if available) or estimate from content-length
      const contentLength = request.headers.get('content-length')
      const fileSize = contentLength ? parseInt(contentLength, 10) : 0

      // Check file size limit (100MB for videos)
      const maxSize = 100 * 1024 * 1024 // 100MB in bytes
      if (fileSize > maxSize) {
        return errorResponse('File size too large. Maximum size is 100MB', 400)
      }

      // Save file upload record to database
      const [uploadRecord] = await db
        .insert(fileUploads)
        .values({
          userId: user.id,
          filename: uniqueFilename,
          originalName: filename,
          mimeType: getMimeType(fileExtension),
          size: fileSize,
          url: blob.url,
          storageProvider: 'vercel',
          metadata: {
            uploadTimestamp: timestamp,
            fileExtension,
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        })
        .returning({
          id: fileUploads.id,
          filename: fileUploads.filename,
          originalName: fileUploads.originalName,
          mimeType: fileUploads.mimeType,
          size: fileUploads.size,
          url: fileUploads.url,
          createdAt: fileUploads.createdAt
        })

      return successResponse({
        upload: uploadRecord,
        blob: {
          url: blob.url,
          pathname: blob.pathname,
          size: fileSize
        }
      }, 'Video uploaded successfully')

    } catch (uploadError) {
      console.error('Video upload error:', uploadError)
      return errorResponse('Failed to upload video', 500)
    }

  } catch (error) {
    return handleApiError(error)
  }
}

function getMimeType(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.m4v': 'video/x-m4v'
  }
  
  return mimeTypes[extension.toLowerCase()] || 'video/mp4'
} 
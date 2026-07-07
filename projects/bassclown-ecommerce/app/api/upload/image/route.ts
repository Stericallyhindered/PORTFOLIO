import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { db, fileUploads } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.', 400)
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File too large. Maximum size is 10MB.', 400)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${random}.${extension}`
    const folder = `images/${user.id}`

    // Upload to Vercel Blob
    const blob = await put(`${folder}/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false
    })

    // Save upload record to database
    const [uploadRecord] = await db
      .insert(fileUploads)
      .values({
        userId: user.id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: blob.url,
        storageProvider: 'vercel',
        metadata: {
          folder,
          pathname: blob.pathname
        }
      })
      .returning()

    return successResponse({
      id: uploadRecord.id,
      url: blob.url,
      filename: uploadRecord.filename,
      originalName: uploadRecord.originalName,
      size: uploadRecord.size,
      type: uploadRecord.mimeType
    }, 'Image uploaded successfully')

  } catch (error) {
    return handleApiError(error)
  }
} 
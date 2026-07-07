import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { w9FormService } from '@/lib/w9-form-service';

export const dynamic = 'force-dynamic';

// GET /api/w9-forms/[id] - Get specific W9 form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id.toString();
    const w9FormId = (await params).id;
    const form = await w9FormService.getW9FormById(w9FormId);

    if (!form) {
      return NextResponse.json({ error: 'W9 form not found' }, { status: 404 });
    }

    // Check if user owns the form or is admin
    if (form.userId !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching W9 form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch W9 form' },
      { status: 500 }
    );
  }
}

// PUT /api/w9-forms/[id] - Update W9 form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id.toString();
    const w9FormId = (await params).id;
    const body = await request.json();
    const { formData } = body;

    if (!formData) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    const updatedForm = await w9FormService.updateW9Form(
      w9FormId,
      userId,
      formData
    );

    return NextResponse.json({ form: updatedForm });
  } catch (error) {
    console.error('Error updating W9 form:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update W9 form' },
      { status: 500 }
    );
  }
} 
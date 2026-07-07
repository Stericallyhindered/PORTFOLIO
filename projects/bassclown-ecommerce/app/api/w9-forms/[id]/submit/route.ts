import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { w9FormService } from '@/lib/w9-form-service';

export const dynamic = 'force-dynamic';

// POST /api/w9-forms/[id]/submit - Submit W9 form for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const w9FormId = (await params).id;
    
    const submittedForm = await w9FormService.submitW9Form(
      w9FormId,
      session.user.id.toString()
    );

    return NextResponse.json({ 
      form: submittedForm,
      message: 'W9 form submitted successfully for review'
    });
  } catch (error) {
    console.error('Error submitting W9 form:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit W9 form' },
      { status: 500 }
    );
  }
} 
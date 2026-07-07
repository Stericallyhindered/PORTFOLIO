import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { w9FormService } from '@/lib/w9-form-service';

export const dynamic = 'force-dynamic';

// GET /api/w9-forms - Get user's W9 forms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forms = await w9FormService.getUserW9Forms(session.user.id.toString());
    
    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Error fetching W9 forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch W9 forms' },
      { status: 500 }
    );
  }
}

// POST /api/w9-forms - Create new W9 form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { formData, contestId, giveawayId } = body;

    if (!formData) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    const form = await w9FormService.createW9Form(
      session.user.id.toString(),
      formData,
      contestId,
      giveawayId
    );

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error('Error creating W9 form:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create W9 form' },
      { status: 500 }
    );
  }
} 
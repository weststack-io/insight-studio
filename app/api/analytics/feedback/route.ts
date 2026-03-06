import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { recordFeedback } from '@/lib/analytics/tracking';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'User has no tenant' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'contentId and contentType are required' },
        { status: 400 }
      );
    }

    const feedbackEvent = await prisma.analyticsEvent.findFirst({
      where: {
        tenantId,
        userId,
        contentId,
        contentType,
        eventType: 'feedback',
      },
      orderBy: { createdAt: 'desc' },
      select: { metadata: true, createdAt: true },
    });

    if (!feedbackEvent) {
      return NextResponse.json({ feedback: null });
    }

    let rating: number | null = null;
    let comment: string | null = null;
    try {
      const parsed = JSON.parse(feedbackEvent.metadata || '{}');
      rating = typeof parsed.rating === 'number' ? parsed.rating : null;
      comment = typeof parsed.comment === 'string' ? parsed.comment : null;
    } catch {
      // Ignore parse issues and return null feedback details.
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ feedback: null });
    }

    return NextResponse.json({
      feedback: {
        rating,
        comment,
        createdAt: feedbackEvent.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const tenantId = (session.user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { contentId, contentType, rating, comment } = body as {
      contentId: string;
      contentType: string;
      rating: number;
      comment?: string;
    };

    if (!contentId || !contentType || !rating) {
      return NextResponse.json(
        { error: 'contentId, contentType, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    await recordFeedback(contentId, contentType, rating, comment, userId, tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

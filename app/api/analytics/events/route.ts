import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { recordEvents, AnalyticsEventInput } from '@/lib/analytics/tracking';

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
    const { events } = body as { events: AnalyticsEventInput[] };

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    if (events.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 events per batch' },
        { status: 400 }
      );
    }

    const recorded = await recordEvents(events, userId, tenantId);

    return NextResponse.json({ success: true, recorded });
  } catch (error) {
    console.error('Failed to record analytics events:', error);
    return NextResponse.json(
      { error: 'Failed to record events' },
      { status: 500 }
    );
  }
}

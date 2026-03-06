import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { batchRecalculateMetrics } from '@/lib/analytics/metrics';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'advisor') {
      return NextResponse.json(
        { error: 'Advisor access only' },
        { status: 403 }
      );
    }

    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant' }, { status: 400 });
    }

    const [eventCount, beforeMetricsCount] = await Promise.all([
      prisma.analyticsEvent.count({ where: { tenantId } }),
      prisma.engagementMetrics.count({ where: { tenantId } }),
    ]);

    if (eventCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No analytics events found for this tenant.',
        processedContentItems: 0,
        eventCount,
        beforeMetricsCount,
        afterMetricsCount: beforeMetricsCount,
      });
    }

    const processedContentItems = await batchRecalculateMetrics(tenantId);
    const afterMetricsCount = await prisma.engagementMetrics.count({
      where: { tenantId },
    });

    return NextResponse.json({
      success: true,
      processedContentItems,
      eventCount,
      beforeMetricsCount,
      afterMetricsCount,
    });
  } catch (error) {
    console.error('Failed to backfill analytics metrics:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to backfill analytics metrics';
    return NextResponse.json(
      { error: 'Failed to backfill analytics metrics', details: message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { batchRecalculateMetrics } from '@/lib/analytics/metrics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'advisor') {
      return NextResponse.json({ error: 'Advisor access only' }, { status: 403 });
    }

    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';

    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - periodDays);

    // KPI data
    const [totalEvents, recentEvents] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { tenantId, createdAt: { gte: startDate } },
      }),
      prisma.analyticsEvent.findMany({
        where: { tenantId, createdAt: { gte: startDate } },
        select: { userId: true, eventType: true, createdAt: true, contentType: true },
      }),
    ]);

    let metrics: Awaited<ReturnType<typeof prisma.engagementMetrics.findMany>> = [];
    try {
      metrics = await prisma.engagementMetrics.findMany({
        where: { tenantId },
        orderBy: { engagementScore: 'desc' },
      });

      if (metrics.length === 0 && totalEvents > 0) {
        await batchRecalculateMetrics(tenantId);
        metrics = await prisma.engagementMetrics.findMany({
          where: { tenantId },
          orderBy: { engagementScore: 'desc' },
        });
      }
    } catch (error) {
      console.warn(
        'Engagement metrics unavailable in dashboard route, using event-only analytics:',
        error
      );
    }

    const activeUsers = new Set(recentEvents.map((e) => e.userId)).size;
    const openEvents = recentEvents.filter((e) => e.eventType === 'open').length;
    const completeEvents = recentEvents.filter(
      (e) => e.eventType === 'complete'
    ).length;

    const avgCompletionRate =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length
        : 0;
    const avgDwellTime =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.avgDwellTime, 0) / metrics.length
        : 0;

    // Daily trends
    const dailyMap = new Map<string, { events: number; users: Set<string> }>();
    for (const e of recentEvents) {
      const dateKey = e.createdAt.toISOString().slice(0, 10);
      const day = dailyMap.get(dateKey) || { events: 0, users: new Set() };
      day.events++;
      day.users.add(e.userId);
      dailyMap.set(dateKey, day);
    }

    const dailyTrends = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, day]) => ({
        date,
        events: day.events,
        uniqueUsers: day.users.size,
      }));

    // Top content (top 10)
    const topContent = metrics.slice(0, 10);

    // Topic popularity (by content type)
    const typeCounts = new Map<string, number>();
    for (const e of recentEvents) {
      if (e.contentType) {
        typeCounts.set(e.contentType, (typeCounts.get(e.contentType) || 0) + 1);
      }
    }
    const topicPopularity = Array.from(typeCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([topic, count]) => ({ topic, count }));

    return NextResponse.json({
      kpis: {
        totalEvents,
        activeUsers,
        openRate: openEvents,
        completionRate: Math.round(avgCompletionRate * 100),
        avgDwellTime: Math.round(avgDwellTime),
        completeEvents,
      },
      dailyTrends,
      topContent,
      topicPopularity,
      period,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

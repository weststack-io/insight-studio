import { prisma } from '@/lib/db/client';

export interface EngagementReport {
  period: { start: string; end: string };
  kpis: {
    totalEvents: number;
    activeUsers: number;
    avgOpenRate: number;
    avgCompletionRate: number;
    avgDwellTime: number;
    avgEngagementScore: number;
  };
  contentBreakdown: {
    contentType: string;
    count: number;
    avgScore: number;
    avgCompletionRate: number;
  }[];
  topContent: {
    contentId: string;
    contentType: string;
    engagementScore: number;
    totalOpens: number;
    completionRate: number;
    avgRating: number | null;
  }[];
  dailyTrends: {
    date: string;
    events: number;
    uniqueUsers: number;
  }[];
}

export async function generateEngagementReport(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<EngagementReport> {
  // Total events in period
  const events = await prisma.analyticsEvent.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { userId: true, eventType: true, createdAt: true },
  });

  const totalEvents = events.length;
  const activeUsers = new Set(events.map((e) => e.userId)).size;

  // Engagement metrics
  const metrics = await prisma.engagementMetrics.findMany({
    where: { tenantId },
    orderBy: { engagementScore: 'desc' },
  });

  const avgOpenRate =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.uniqueOpens, 0) / metrics.length
      : 0;
  const avgCompletionRate =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length
      : 0;
  const avgDwellTime =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.avgDwellTime, 0) / metrics.length
      : 0;
  const avgEngagementScore =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.engagementScore, 0) / metrics.length
      : 0;

  // Content type breakdown
  const typeGroups = new Map<
    string,
    { count: number; totalScore: number; totalCompletion: number }
  >();
  for (const m of metrics) {
    const group = typeGroups.get(m.contentType) || {
      count: 0,
      totalScore: 0,
      totalCompletion: 0,
    };
    group.count++;
    group.totalScore += m.engagementScore;
    group.totalCompletion += m.completionRate;
    typeGroups.set(m.contentType, group);
  }

  const contentBreakdown = Array.from(typeGroups.entries()).map(
    ([contentType, group]) => ({
      contentType,
      count: group.count,
      avgScore: Math.round(group.totalScore / group.count),
      avgCompletionRate: Math.round((group.totalCompletion / group.count) * 100),
    })
  );

  // Top content
  const topContent = metrics.slice(0, 10).map((m) => ({
    contentId: m.contentId,
    contentType: m.contentType,
    engagementScore: m.engagementScore,
    totalOpens: m.totalOpens,
    completionRate: m.completionRate,
    avgRating: m.avgRating,
  }));

  // Daily trends
  const dailyMap = new Map<string, { events: number; users: Set<string> }>();
  for (const e of events) {
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

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    kpis: {
      totalEvents,
      activeUsers,
      avgOpenRate: Math.round(avgOpenRate),
      avgCompletionRate: Math.round(avgCompletionRate * 100),
      avgDwellTime: Math.round(avgDwellTime),
      avgEngagementScore: Math.round(avgEngagementScore),
    },
    contentBreakdown,
    topContent,
    dailyTrends,
  };
}

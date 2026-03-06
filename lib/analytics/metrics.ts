import { prisma } from '@/lib/db/client';

/**
 * Recalculate engagement metrics for a single piece of content.
 * Aggregates from AnalyticsEvent → upserts EngagementMetrics.
 */
export async function recalculateMetrics(
  contentId: string,
  contentType: string,
  tenantId: string
) {
  const events = await prisma.analyticsEvent.findMany({
    where: { contentId, contentType },
    select: { eventType: true, metadata: true, userId: true, createdAt: true },
  });

  if (events.length === 0) return;

  // Opens
  const openEvents = events.filter((e) => e.eventType === 'open');
  const totalOpens = openEvents.length;
  const uniqueOpens = new Set(openEvents.map((e) => e.userId)).size;

  // Dwell time
  const dwellEvents = events.filter((e) => e.eventType === 'dwell');
  const dwellTimes = dwellEvents
    .map((e) => {
      try {
        return (JSON.parse(e.metadata || '{}').seconds as number) || 0;
      } catch {
        return 0;
      }
    })
    .filter((s) => s > 0);
  const avgDwellTime =
    dwellTimes.length > 0
      ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
      : 0;

  // Scroll depth
  const scrollEvents = events.filter((e) => e.eventType === 'scroll');
  const scrollDepths = scrollEvents
    .map((e) => {
      try {
        return (JSON.parse(e.metadata || '{}').depth as number) || 0;
      } catch {
        return 0;
      }
    })
    .filter((d) => d > 0);
  const avgScrollDepth =
    scrollDepths.length > 0
      ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length
      : 0;

  // Completion rate
  const completionEvents = events.filter((e) => e.eventType === 'complete');
  const uniqueCompleters = new Set(completionEvents.map((e) => e.userId)).size;
  const completionRate = uniqueOpens > 0 ? uniqueCompleters / uniqueOpens : 0;

  // Rating
  const feedbackEvents = events.filter((e) => e.eventType === 'feedback');
  const ratings = feedbackEvents
    .map((e) => {
      try {
        return JSON.parse(e.metadata || '{}').rating as number;
      } catch {
        return null;
      }
    })
    .filter((r): r is number => r != null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;
  const totalFeedback = ratings.length;

  // Engagement score (0-100 composite)
  const engagementScore = calculateEngagementScore({
    totalOpens,
    avgDwellTime,
    avgScrollDepth,
    completionRate,
    avgRating,
  });

  // Last engaged
  const lastEngagedAt = events.reduce((latest, e) => {
    return e.createdAt > latest ? e.createdAt : latest;
  }, events[0].createdAt);

  await prisma.engagementMetrics.upsert({
    where: { contentId_contentType: { contentId, contentType } },
    create: {
      tenantId,
      contentId,
      contentType,
      totalOpens,
      uniqueOpens,
      avgDwellTime,
      avgScrollDepth,
      completionRate,
      avgRating,
      totalFeedback,
      engagementScore,
      lastEngagedAt,
    },
    update: {
      totalOpens,
      uniqueOpens,
      avgDwellTime,
      avgScrollDepth,
      completionRate,
      avgRating,
      totalFeedback,
      engagementScore,
      lastEngagedAt,
    },
  });
}

/**
 * Weighted composite engagement score (0-100).
 * Opens: 15%, Dwell time: 25%, Scroll depth: 15%, Completion rate: 30%, Rating: 15%
 */
export function calculateEngagementScore({
  totalOpens,
  avgDwellTime,
  avgScrollDepth,
  completionRate,
  avgRating,
}: {
  totalOpens: number;
  avgDwellTime: number;
  avgScrollDepth: number;
  completionRate: number;
  avgRating: number | null;
}): number {
  // Normalize opens: cap at 50 views → 100%
  const openScore = Math.min(totalOpens / 50, 1) * 100;

  // Normalize dwell: 300s (5 min) → 100%
  const dwellScore = Math.min(avgDwellTime / 300, 1) * 100;

  // Scroll depth is already 0-100
  const scrollScore = avgScrollDepth;

  // Completion rate is 0-1 → 0-100
  const completionScore = completionRate * 100;

  // Rating: 1-5 → 0-100 (1=0, 5=100)
  const ratingScore = avgRating ? ((avgRating - 1) / 4) * 100 : 50; // Default 50 if no ratings

  const score =
    openScore * 0.15 +
    dwellScore * 0.25 +
    scrollScore * 0.15 +
    completionScore * 0.3 +
    ratingScore * 0.15;

  return Math.round(Math.min(Math.max(score, 0), 100));
}

/**
 * Batch recalculate metrics for all content with recent events.
 */
export async function batchRecalculateMetrics(tenantId: string) {
  // Fetch event content references and de-duplicate in app code.
  // This avoids SQL DISTINCT edge cases across adapters/providers.
  const contentEventRefs = await prisma.analyticsEvent.findMany({
    where: {
      tenantId,
      contentId: { not: null },
      contentType: { not: null },
    },
    select: { contentId: true, contentType: true },
  });

  const uniqueContent = new Set<string>();
  for (const item of contentEventRefs) {
    if (!item.contentId || !item.contentType) continue;
    uniqueContent.add(`${item.contentId}::${item.contentType}`);
  }

  for (const key of uniqueContent) {
    const [contentId, contentType] = key.split('::');
    if (contentId && contentType) {
      await recalculateMetrics(contentId, contentType, tenantId);
    }
  }

  return uniqueContent.size;
}

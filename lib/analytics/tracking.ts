import { prisma } from '@/lib/db/client';
import { recalculateMetrics } from './metrics';

const VALID_EVENT_TYPES = [
  'open',
  'click',
  'scroll',
  'dwell',
  'complete',
  'feedback',
  'search',
] as const;

export type EventType = (typeof VALID_EVENT_TYPES)[number];

const VALID_CONTENT_TYPES = ['briefing', 'explainer', 'lesson'] as const;
export type ContentType = (typeof VALID_CONTENT_TYPES)[number];

export interface AnalyticsEventInput {
  contentId?: string;
  contentType?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

function isValidEventType(type: string): type is EventType {
  return VALID_EVENT_TYPES.includes(type as EventType);
}

function isValidContentType(type: string): type is ContentType {
  return VALID_CONTENT_TYPES.includes(type as ContentType);
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  if (!metadata) return null;
  // Strip any potentially dangerous keys, keep it under a reasonable size
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof key === 'string' && key.length <= 100) {
      safe[key] = typeof value === 'string' ? value.slice(0, 2000) : value;
    }
  }
  const json = JSON.stringify(safe);
  if (json.length > 10000) return null;
  return json;
}

export async function recordEvents(
  events: AnalyticsEventInput[],
  userId: string,
  tenantId: string
): Promise<number> {
  const validEvents = events
    .filter((e) => isValidEventType(e.eventType))
    .filter(
      (e) => !e.contentType || isValidContentType(e.contentType)
    )
    .map((e) => ({
      tenantId,
      userId,
      contentId: e.contentId || null,
      contentType: e.contentType || null,
      eventType: e.eventType,
      metadata: sanitizeMetadata(e.metadata),
      sessionId: e.sessionId || null,
    }));

  if (validEvents.length === 0) return 0;

  const result = await prisma.analyticsEvent.createMany({
    data: validEvents,
  });

  // Keep engagement_metrics in sync with fresh event data.
  const touchedContent = new Set<string>();
  for (const event of validEvents) {
    if (!event.contentId || !event.contentType) continue;
    touchedContent.add(`${event.contentId}::${event.contentType}`);
  }

  try {
    await Promise.all(
      Array.from(touchedContent).map((key) => {
        const [contentId, contentType] = key.split('::');
        return recalculateMetrics(contentId, contentType, tenantId);
      })
    );
  } catch (error) {
    console.warn('Failed to recalculate engagement metrics after events:', error);
  }

  return result.count;
}

export async function recordFeedback(
  contentId: string,
  contentType: string,
  rating: number,
  comment: string | undefined,
  userId: string,
  tenantId: string
): Promise<void> {
  if (!isValidContentType(contentType)) {
    throw new Error(`Invalid content type: ${contentType}`);
  }
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  await prisma.analyticsEvent.create({
    data: {
      tenantId,
      userId,
      contentId,
      contentType,
      eventType: 'feedback',
      metadata: JSON.stringify({ rating, comment: comment?.slice(0, 1000) }),
    },
  });

  try {
    // Update pre-aggregated avg rating
    const feedbackEvents = await prisma.analyticsEvent.findMany({
      where: { contentId, contentType, eventType: 'feedback' },
      select: { metadata: true },
    });

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

    await prisma.engagementMetrics.upsert({
      where: { contentId_contentType: { contentId, contentType } },
      create: {
        tenantId,
        contentId,
        contentType,
        avgRating,
        totalFeedback: ratings.length,
      },
      update: {
        avgRating,
        totalFeedback: ratings.length,
      },
    });

    // Ensure all engagement fields stay up to date after feedback events.
    await recalculateMetrics(contentId, contentType, tenantId);
  } catch (error) {
    console.warn('Failed to update engagement metrics after feedback:', error);
  }
}

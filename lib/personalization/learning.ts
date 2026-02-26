import { prisma } from '@/lib/db/client';

type InterestLevel = 'low' | 'medium' | 'high';

const LEVEL_ORDER: InterestLevel[] = ['low', 'medium', 'high'];

// Engagement signal weights
const SIGNAL_WEIGHTS = {
  open: 1,
  dwell_60: 2, // dwell > 60s
  dwell_180: 4, // dwell > 180s (additional, on top of dwell_60)
  complete: 5,
  rating_high: 3, // rating >= 4
  rating_low: -3, // rating <= 2
};

const MIN_EVENTS_THRESHOLD = 5;
const CONFIDENCE_THRESHOLD = 0.6;
const LOOKBACK_DAYS = 30;

interface TopicScore {
  topic: string;
  score: number;
  eventCount: number;
  confidence: number;
}

interface PreferenceAdjustment {
  topic: string;
  previousLevel: InterestLevel;
  newLevel: InterestLevel;
  score: number;
  confidence: number;
  reason: Record<string, unknown>;
}

/**
 * Analyze a user's engagement behavior over the last 30 days.
 * Returns scored topics from their content interactions.
 */
export async function analyzeUserBehavior(
  userId: string
): Promise<TopicScore[]> {
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      contentType: { not: null },
    },
    select: {
      eventType: true,
      contentType: true,
      metadata: true,
    },
  });

  // Group events by content type (which maps to topic categories)
  const topicScores = new Map<
    string,
    { score: number; eventCount: number; signals: Record<string, number> }
  >();

  for (const event of events) {
    const topic = event.contentType!;
    const entry = topicScores.get(topic) || {
      score: 0,
      eventCount: 0,
      signals: {},
    };
    entry.eventCount++;

    let metadata: Record<string, any> = {};
    try {
      metadata = JSON.parse(event.metadata || '{}');
    } catch {
      // ignore
    }

    switch (event.eventType) {
      case 'open':
        entry.score += SIGNAL_WEIGHTS.open;
        entry.signals.opens = (entry.signals.opens || 0) + 1;
        break;
      case 'dwell': {
        const seconds = metadata.seconds || 0;
        if (seconds > 60) {
          entry.score += SIGNAL_WEIGHTS.dwell_60;
          entry.signals.dwell_60 = (entry.signals.dwell_60 || 0) + 1;
        }
        if (seconds > 180) {
          entry.score += SIGNAL_WEIGHTS.dwell_180;
          entry.signals.dwell_180 = (entry.signals.dwell_180 || 0) + 1;
        }
        break;
      }
      case 'complete':
        entry.score += SIGNAL_WEIGHTS.complete;
        entry.signals.completions = (entry.signals.completions || 0) + 1;
        break;
      case 'feedback': {
        const rating = metadata.rating;
        if (rating >= 4) {
          entry.score += SIGNAL_WEIGHTS.rating_high;
          entry.signals.positive_ratings =
            (entry.signals.positive_ratings || 0) + 1;
        } else if (rating <= 2) {
          entry.score += SIGNAL_WEIGHTS.rating_low;
          entry.signals.negative_ratings =
            (entry.signals.negative_ratings || 0) + 1;
        }
        break;
      }
    }

    topicScores.set(topic, entry);
  }

  return Array.from(topicScores.entries()).map(([topic, data]) => ({
    topic,
    score: data.score,
    eventCount: data.eventCount,
    confidence: Math.min(data.eventCount / MIN_EVENTS_THRESHOLD, 1),
  }));
}

/**
 * Compute preference adjustments based on engagement analysis.
 * Conservative: only moves one level at a time, requires confidence > 0.6.
 */
export async function computePreferenceAdjustments(
  userId: string,
  topicScores: TopicScore[]
): Promise<PreferenceAdjustment[]> {
  if (topicScores.length === 0) return [];

  // Get existing preferences
  const existing = await prisma.userPreference.findMany({
    where: { userId },
  });
  const prefMap = new Map(
    existing.map((p) => [p.topic, p.interestLevel as InterestLevel])
  );

  // Normalize scores to percentile ranks
  const sorted = [...topicScores].sort((a, b) => a.score - b.score);
  const total = sorted.length;

  const adjustments: PreferenceAdjustment[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const topic = sorted[i];

    // Skip low-confidence topics
    if (topic.confidence < CONFIDENCE_THRESHOLD) continue;

    const percentile = (i + 1) / total;
    let targetLevel: InterestLevel;
    if (percentile >= 0.75) {
      targetLevel = 'high';
    } else if (percentile >= 0.25) {
      targetLevel = 'medium';
    } else {
      targetLevel = 'low';
    }

    const currentLevel = prefMap.get(topic.topic) || 'medium';
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
    const targetIndex = LEVEL_ORDER.indexOf(targetLevel);

    // Only move one level at a time
    let newLevel = currentLevel;
    if (targetIndex > currentIndex) {
      newLevel = LEVEL_ORDER[currentIndex + 1];
    } else if (targetIndex < currentIndex) {
      newLevel = LEVEL_ORDER[currentIndex - 1];
    }

    if (newLevel !== currentLevel) {
      adjustments.push({
        topic: topic.topic,
        previousLevel: currentLevel,
        newLevel,
        score: topic.score,
        confidence: topic.confidence,
        reason: {
          percentile: Math.round(percentile * 100),
          eventCount: topic.eventCount,
          rawScore: topic.score,
        },
      });
    }
  }

  return adjustments;
}

/**
 * Apply preference learning for a single user.
 * Logs all changes and updates UserPreference records.
 */
export async function applyPreferenceLearning(userId: string): Promise<number> {
  const topicScores = await analyzeUserBehavior(userId);
  const adjustments = await computePreferenceAdjustments(userId, topicScores);

  for (const adj of adjustments) {
    // Log the adjustment
    await prisma.preferenceLearningLog.create({
      data: {
        userId,
        topic: adj.topic,
        previousLevel: adj.previousLevel,
        newLevel: adj.newLevel,
        reason: JSON.stringify(adj.reason),
        confidence: adj.confidence,
      },
    });

    // Apply the adjustment
    await prisma.userPreference.upsert({
      where: { userId_topic: { userId, topic: adj.topic } },
      create: {
        userId,
        topic: adj.topic,
        interestLevel: adj.newLevel,
      },
      update: {
        interestLevel: adj.newLevel,
      },
    });
  }

  return adjustments.length;
}

/**
 * Batch apply preference learning for all users in a tenant.
 */
export async function batchLearnPreferences(
  tenantId: string
): Promise<{ usersProcessed: number; adjustmentsMade: number }> {
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  // Find users with recent activity
  const activeUsers = await prisma.analyticsEvent.findMany({
    where: { tenantId, createdAt: { gte: since } },
    distinct: ['userId'],
    select: { userId: true },
  });

  let adjustmentsMade = 0;
  for (const { userId } of activeUsers) {
    const count = await applyPreferenceLearning(userId);
    adjustmentsMade += count;
  }

  return { usersProcessed: activeUsers.length, adjustmentsMade };
}

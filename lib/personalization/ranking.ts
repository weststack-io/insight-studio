import { Briefing, Explainer, Lesson } from '@/types';
import { PortfolioData } from '@/types';

interface UserProfile {
  preferences: string[];
  generation?: string;
  sophisticationLevel?: string;
  portfolioData?: PortfolioData;
}

/**
 * Rank briefings based on user profile
 */
export function rankBriefings(
  briefings: Briefing[],
  profile: UserProfile
): Briefing[] {
  return briefings.map(briefing => ({
    ...briefing,
    _score: calculateBriefingScore(briefing, profile),
  })).sort((a, b) => (b as any)._score - (a as any)._score);
}

/**
 * Rank explainers based on user profile
 */
export function rankExplainers(
  explainers: Explainer[],
  profile: UserProfile
): Explainer[] {
  return explainers.map(explainer => ({
    ...explainer,
    _score: calculateExplainerScore(explainer, profile),
  })).sort((a, b) => (b as any)._score - (a as any)._score);
}

/**
 * Rank lessons based on user profile
 */
export function rankLessons(
  lessons: Lesson[],
  profile: UserProfile
): Lesson[] {
  return lessons.map(lesson => ({
    ...lesson,
    _score: calculateLessonScore(lesson, profile),
  })).sort((a, b) => (b as any)._score - (a as any)._score);
}

function calculateBriefingScore(briefing: Briefing, profile: UserProfile): number {
  let score = 0;

  // Recency score (newer is better)
  const daysSinceGeneration = Math.floor(
    (Date.now() - new Date(briefing.generatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.max(0, 10 - daysSinceGeneration);

  // Portfolio briefing gets higher score if user has portfolio data
  if (briefing.type === 'portfolio' && profile.portfolioData) {
    score += 5;
  }

  return score;
}

function calculateExplainerScore(explainer: Explainer, profile: UserProfile): number {
  let score = 0;

  // Topic preference match
  const topicLower = explainer.topic.toLowerCase();
  const hasPreferenceMatch = profile.preferences.some(pref =>
    topicLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(topicLower)
  );
  if (hasPreferenceMatch) {
    score += 10;
  }

  // Recency score
  const daysSinceGeneration = Math.floor(
    (Date.now() - new Date(explainer.generatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.max(0, 5 - daysSinceGeneration);

  // Portfolio-based relevance
  if (profile.portfolioData) {
    const holdings = profile.portfolioData.holdings;
    const relevantHoldings = holdings.filter(h =>
      explainer.topic.toLowerCase().includes(h.assetClass?.toLowerCase() || '') ||
      explainer.topic.toLowerCase().includes(h.name.toLowerCase())
    );
    if (relevantHoldings.length > 0) {
      score += relevantHoldings.length * 2;
    }
  }

  return score;
}

function calculateLessonScore(lesson: Lesson, profile: UserProfile): number {
  let score = 0;

  // Generation match
  if (lesson.generation && profile.generation === lesson.generation) {
    score += 5;
  }

  // Sophistication level match
  if (lesson.sophisticationLevel && profile.sophisticationLevel === lesson.sophisticationLevel) {
    score += 5;
  }

  // Topic preference match
  const topicLower = lesson.topic.toLowerCase();
  const hasPreferenceMatch = profile.preferences.some(pref =>
    topicLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(topicLower)
  );
  if (hasPreferenceMatch) {
    score += 10;
  }

  // Recency score
  const daysSinceGeneration = Math.floor(
    (Date.now() - new Date(lesson.generatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.max(0, 5 - daysSinceGeneration);

  return score;
}


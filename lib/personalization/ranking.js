"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankBriefings = rankBriefings;
exports.rankExplainers = rankExplainers;
exports.rankLessons = rankLessons;
/**
 * Rank briefings based on user profile
 */
function rankBriefings(briefings, profile) {
    return briefings.map(briefing => ({
        ...briefing,
        _score: calculateBriefingScore(briefing, profile),
    })).sort((a, b) => b._score - a._score);
}
/**
 * Rank explainers based on user profile
 */
function rankExplainers(explainers, profile) {
    return explainers.map(explainer => ({
        ...explainer,
        _score: calculateExplainerScore(explainer, profile),
    })).sort((a, b) => b._score - a._score);
}
/**
 * Rank lessons based on user profile
 */
function rankLessons(lessons, profile) {
    return lessons.map(lesson => ({
        ...lesson,
        _score: calculateLessonScore(lesson, profile),
    })).sort((a, b) => b._score - a._score);
}
function calculateBriefingScore(briefing, profile) {
    let score = 0;
    // Recency score (newer is better)
    const daysSinceGeneration = Math.floor((Date.now() - new Date(briefing.generatedAt).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 10 - daysSinceGeneration);
    // Portfolio briefing gets higher score if user has portfolio data
    if (briefing.type === 'portfolio' && profile.portfolioData) {
        score += 5;
    }
    return score;
}
function calculateExplainerScore(explainer, profile) {
    let score = 0;
    // Topic preference match
    const topicLower = explainer.topic.toLowerCase();
    const hasPreferenceMatch = profile.preferences.some(pref => topicLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(topicLower));
    if (hasPreferenceMatch) {
        score += 10;
    }
    // Recency score
    const daysSinceGeneration = Math.floor((Date.now() - new Date(explainer.generatedAt).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 5 - daysSinceGeneration);
    // Portfolio-based relevance
    if (profile.portfolioData) {
        const holdings = profile.portfolioData.holdings;
        const relevantHoldings = holdings.filter(h => explainer.topic.toLowerCase().includes(h.assetClass?.toLowerCase() || '') ||
            explainer.topic.toLowerCase().includes(h.name.toLowerCase()));
        if (relevantHoldings.length > 0) {
            score += relevantHoldings.length * 2;
        }
    }
    return score;
}
function calculateLessonScore(lesson, profile) {
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
    const hasPreferenceMatch = profile.preferences.some(pref => topicLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(topicLower));
    if (hasPreferenceMatch) {
        score += 10;
    }
    // Recency score
    const daysSinceGeneration = Math.floor((Date.now() - new Date(lesson.generatedAt).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 5 - daysSinceGeneration);
    return score;
}
//# sourceMappingURL=ranking.js.map
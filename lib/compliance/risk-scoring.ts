import { prisma } from "@/lib/db/client";
import { Citation } from "./citations";
import { checkRestrictedTerms, checkHighRiskTerms } from "./guardrails";

export interface RiskFactors {
  contentSensitivity?: number; // 0-100
  citationConfidence?: number; // 0-100 (average confidence)
  userProfileRisk?: number; // 0-100
  historicalPatterns?: number; // 0-100
  restrictedTerms?: number; // 0-100
  highRiskTerms?: number; // 0-100
}

export interface RiskScoreResult {
  totalScore: number; // 0-100
  factors: RiskFactors;
  breakdown: {
    factor: string;
    score: number;
    weight: number;
    contribution: number;
  }[];
  requiresReview: boolean;
  autoApprove: boolean;
}

/**
 * Calculate multi-factor risk score
 */
export async function calculateMultiFactorRiskScore(
  content: string,
  contentType: "briefing" | "explainer" | "lesson",
  citations: Citation[],
  userId: string,
  tenantId: string,
  metadata?: {
    topics?: string[];
    wordCount?: number;
  }
): Promise<RiskScoreResult> {
  const factors: RiskFactors = {};

  // 1. Content Sensitivity (market stress, product mentions)
  factors.contentSensitivity = calculateContentSensitivity(
    content,
    contentType,
    metadata?.topics
  );

  // 2. Citation Confidence Scores
  factors.citationConfidence = calculateCitationConfidence(citations);

  // 3. User Profile Risk Level
  factors.userProfileRisk = await calculateUserProfileRisk(userId);

  // 4. Historical Content Patterns
  factors.historicalPatterns = await calculateHistoricalPatterns(
    userId,
    tenantId,
    contentType
  );

  // 5. Restricted Terms
  const restrictedTerms = checkRestrictedTerms(content);
  factors.restrictedTerms = restrictedTerms.length * 20; // Each violation adds 20 points

  // 6. High-Risk Terms
  const highRiskTerms = checkHighRiskTerms(content);
  factors.highRiskTerms = highRiskTerms.length * 5; // Each term adds 5 points

  // Calculate weighted total score
  const weights = {
    contentSensitivity: 0.25,
    citationConfidence: 0.20,
    userProfileRisk: 0.15,
    historicalPatterns: 0.10,
    restrictedTerms: 0.20,
    highRiskTerms: 0.10,
  };

  const breakdown = [
    {
      factor: "Content Sensitivity",
      score: factors.contentSensitivity || 0,
      weight: weights.contentSensitivity,
      contribution:
        (factors.contentSensitivity || 0) * weights.contentSensitivity,
    },
    {
      factor: "Citation Confidence",
      score: factors.citationConfidence || 0,
      weight: weights.citationConfidence,
      contribution:
        (100 - (factors.citationConfidence || 0)) * weights.citationConfidence, // Lower confidence = higher risk
    },
    {
      factor: "User Profile Risk",
      score: factors.userProfileRisk || 0,
      weight: weights.userProfileRisk,
      contribution: (factors.userProfileRisk || 0) * weights.userProfileRisk,
    },
    {
      factor: "Historical Patterns",
      score: factors.historicalPatterns || 0,
      weight: weights.historicalPatterns,
      contribution: (factors.historicalPatterns || 0) * weights.historicalPatterns,
    },
    {
      factor: "Restricted Terms",
      score: factors.restrictedTerms || 0,
      weight: weights.restrictedTerms,
      contribution: (factors.restrictedTerms || 0) * weights.restrictedTerms,
    },
    {
      factor: "High-Risk Terms",
      score: factors.highRiskTerms || 0,
      weight: weights.highRiskTerms,
      contribution: (factors.highRiskTerms || 0) * weights.highRiskTerms,
    },
  ];

  const totalScore = breakdown.reduce(
    (sum, item) => sum + item.contribution,
    0
  );

  // Determine if review is required
  // Default thresholds (can be overridden by policy)
  const requireReviewThreshold = 50;
  const autoApproveThreshold = 30;

  return {
    totalScore: Math.min(Math.max(totalScore, 0), 100), // Clamp to 0-100
    factors,
    breakdown,
    requiresReview: totalScore >= requireReviewThreshold,
    autoApprove: totalScore < autoApproveThreshold,
  };
}

/**
 * Calculate content sensitivity score
 */
function calculateContentSensitivity(
  content: string,
  contentType: "briefing" | "explainer" | "lesson",
  topics?: string[]
): number {
  let score = 0;
  const lowerContent = content.toLowerCase();

  // Market stress indicators
  const stressIndicators = [
    "recession",
    "crash",
    "bear market",
    "volatility",
    "uncertainty",
    "crisis",
    "decline",
    "drop",
    "fall",
    "plunge",
  ];
  const stressCount = stressIndicators.filter((indicator) =>
    lowerContent.includes(indicator)
  ).length;
  score += stressCount * 10; // Each indicator adds 10 points

  // Product mentions (higher risk)
  const productTerms = [
    "investment product",
    "security",
    "derivative",
    "option",
    "future",
    "swap",
    "structured product",
  ];
  const productCount = productTerms.filter((term) =>
    lowerContent.includes(term)
  ).length;
  score += productCount * 15; // Each product mention adds 15 points

  // Portfolio-specific content (briefings are higher risk)
  if (contentType === "briefing") {
    score += 10; // Briefings are inherently more sensitive
  }

  // Specific high-risk topics
  if (topics) {
    const highRiskTopics = [
      "cryptocurrency",
      "crypto",
      "derivatives",
      "leverage",
      "margin",
      "speculation",
    ];
    const riskyTopicCount = topics.filter((topic) =>
      highRiskTopics.some((hrt) => topic.toLowerCase().includes(hrt))
    ).length;
    score += riskyTopicCount * 20;
  }

  return Math.min(score, 100);
}

/**
 * Calculate average citation confidence (inverted - lower confidence = higher risk)
 */
function calculateCitationConfidence(citations: Citation[]): number {
  if (citations.length === 0) {
    return 50; // No citations = medium risk
  }

  const avgConfidence =
    citations.reduce((sum, c) => sum + c.confidenceScore, 0) /
    citations.length;

  // Convert to risk score (lower confidence = higher risk)
  // If confidence is 0.8, risk is 20 (100 - 80)
  return (1 - avgConfidence) * 100;
}

/**
 * Calculate user profile risk level
 */
async function calculateUserProfileRisk(userId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        sophisticationLevel: true,
        role: true,
      },
    });

    if (!user) {
      return 0; // Unknown user = low risk (conservative)
    }

    let risk = 0;

    // Sophistication level affects risk
    // Advanced users can handle more complex/risky content
    if (user.sophisticationLevel === "beginner") {
      risk += 30; // Beginners need more protection
    } else if (user.sophisticationLevel === "intermediate") {
      risk += 15;
    }
    // Advanced users get 0 additional risk

    // Role-based risk
    if (user.role === "family_member") {
      risk += 10; // Family members may need more protection
    }

    return Math.min(risk, 100);
  } catch (error) {
    console.error("Failed to calculate user profile risk:", error);
    return 0; // Default to low risk on error
  }
}

/**
 * Calculate historical content patterns risk
 */
async function calculateHistoricalPatterns(
  userId: string,
  tenantId: string,
  contentType: "briefing" | "explainer" | "lesson"
): Promise<number> {
  try {
    // Check historical content for this user/tenant
    let historicalContent: any[] = [];

    if (contentType === "briefing") {
      historicalContent = await prisma.briefing.findMany({
        where: {
          userId,
          tenantId,
        },
        take: 10,
        orderBy: {
          generatedAt: "desc",
        },
        select: {
          riskScore: true,
          status: true,
        },
      });
    } else if (contentType === "explainer") {
      historicalContent = await prisma.explainer.findMany({
        where: {
          tenantId,
        },
        take: 10,
        orderBy: {
          generatedAt: "desc",
        },
        select: {
          riskScore: true,
        },
      });
    } else if (contentType === "lesson") {
      historicalContent = await prisma.lesson.findMany({
        where: {
          tenantId,
        },
        take: 10,
        orderBy: {
          generatedAt: "desc",
        },
        select: {
          riskScore: true,
        },
      });
    }

    if (historicalContent.length === 0) {
      return 0; // No history = low risk
    }

    // Calculate average historical risk
    const riskScores = historicalContent
      .map((c) => c.riskScore)
      .filter((rs): rs is number => rs !== null && rs !== undefined);

    if (riskScores.length === 0) {
      return 0;
    }

    const avgRisk =
      riskScores.reduce((sum, rs) => sum + rs, 0) / riskScores.length;

    // If historical average is high, current content is more likely to be high risk
    return Math.min(avgRisk * 0.5, 50); // Cap at 50 to not over-weight history
  } catch (error) {
    console.error("Failed to calculate historical patterns:", error);
    return 0;
  }
}

/**
 * Determine if content should be automatically routed to advisor review
 */
export async function shouldRouteToReview(
  riskScore: number,
  tenantId: string
): Promise<boolean> {
  try {
    // Check if tenant has custom risk threshold policy
    const { getPoliciesByType } = await import("./policy-engine");
    const riskPolicies = await getPoliciesByType(tenantId, "risk_thresholds");

    if (riskPolicies.length > 0) {
      const policy = riskPolicies[0];
      const thresholds = policy.config.riskThresholds;
      if (thresholds?.requireReview) {
        return riskScore >= thresholds.requireReview;
      }
    }

    // Default threshold
    return riskScore >= 50;
  } catch (error) {
    console.error("Failed to check review routing:", error);
    // Default to requiring review if risk score is high
    return riskScore >= 50;
  }
}


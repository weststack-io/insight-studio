"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMultiFactorRiskScore = calculateMultiFactorRiskScore;
exports.shouldRouteToReview = shouldRouteToReview;
const client_1 = require("@/lib/db/client");
const guardrails_1 = require("./guardrails");
/**
 * Calculate multi-factor risk score
 */
async function calculateMultiFactorRiskScore(content, contentType, citations, userId, tenantId, metadata) {
    const factors = {};
    // 1. Content Sensitivity (market stress, product mentions)
    factors.contentSensitivity = calculateContentSensitivity(content, contentType, metadata?.topics);
    // 2. Citation Confidence Scores
    factors.citationConfidence = calculateCitationConfidence(citations);
    // 3. User Profile Risk Level
    factors.userProfileRisk = await calculateUserProfileRisk(userId);
    // 4. Historical Content Patterns
    factors.historicalPatterns = await calculateHistoricalPatterns(userId, tenantId, contentType);
    // 5. Restricted Terms
    const restrictedTerms = (0, guardrails_1.checkRestrictedTerms)(content);
    factors.restrictedTerms = restrictedTerms.length * 20; // Each violation adds 20 points
    // 6. High-Risk Terms
    const highRiskTerms = (0, guardrails_1.checkHighRiskTerms)(content);
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
            contribution: (factors.contentSensitivity || 0) * weights.contentSensitivity,
        },
        {
            factor: "Citation Confidence",
            score: factors.citationConfidence || 0,
            weight: weights.citationConfidence,
            contribution: (100 - (factors.citationConfidence || 0)) * weights.citationConfidence, // Lower confidence = higher risk
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
    const totalScore = breakdown.reduce((sum, item) => sum + item.contribution, 0);
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
function calculateContentSensitivity(content, contentType, topics) {
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
    const stressCount = stressIndicators.filter((indicator) => lowerContent.includes(indicator)).length;
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
    const productCount = productTerms.filter((term) => lowerContent.includes(term)).length;
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
        const riskyTopicCount = topics.filter((topic) => highRiskTopics.some((hrt) => topic.toLowerCase().includes(hrt))).length;
        score += riskyTopicCount * 20;
    }
    return Math.min(score, 100);
}
/**
 * Calculate average citation confidence (inverted - lower confidence = higher risk)
 */
function calculateCitationConfidence(citations) {
    if (citations.length === 0) {
        return 50; // No citations = medium risk
    }
    const avgConfidence = citations.reduce((sum, c) => sum + c.confidenceScore, 0) /
        citations.length;
    // Convert to risk score (lower confidence = higher risk)
    // If confidence is 0.8, risk is 20 (100 - 80)
    return (1 - avgConfidence) * 100;
}
/**
 * Calculate user profile risk level
 */
async function calculateUserProfileRisk(userId) {
    try {
        const user = await client_1.prisma.user.findUnique({
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
        }
        else if (user.sophisticationLevel === "intermediate") {
            risk += 15;
        }
        // Advanced users get 0 additional risk
        // Role-based risk
        if (user.role === "family_member") {
            risk += 10; // Family members may need more protection
        }
        return Math.min(risk, 100);
    }
    catch (error) {
        console.error("Failed to calculate user profile risk:", error);
        return 0; // Default to low risk on error
    }
}
/**
 * Calculate historical content patterns risk
 */
async function calculateHistoricalPatterns(userId, tenantId, contentType) {
    try {
        // Check historical content for this user/tenant
        let historicalContent = [];
        if (contentType === "briefing") {
            historicalContent = await client_1.prisma.briefing.findMany({
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
        }
        else if (contentType === "explainer") {
            historicalContent = await client_1.prisma.explainer.findMany({
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
        else if (contentType === "lesson") {
            historicalContent = await client_1.prisma.lesson.findMany({
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
            .filter((rs) => rs !== null && rs !== undefined);
        if (riskScores.length === 0) {
            return 0;
        }
        const avgRisk = riskScores.reduce((sum, rs) => sum + rs, 0) / riskScores.length;
        // If historical average is high, current content is more likely to be high risk
        return Math.min(avgRisk * 0.5, 50); // Cap at 50 to not over-weight history
    }
    catch (error) {
        console.error("Failed to calculate historical patterns:", error);
        return 0;
    }
}
/**
 * Determine if content should be automatically routed to advisor review
 */
async function shouldRouteToReview(riskScore, tenantId) {
    try {
        // Check if tenant has custom risk threshold policy
        const { getPoliciesByType } = await Promise.resolve().then(() => __importStar(require("./policy-engine")));
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
    }
    catch (error) {
        console.error("Failed to check review routing:", error);
        // Default to requiring review if risk score is high
        return riskScore >= 50;
    }
}
//# sourceMappingURL=risk-scoring.js.map
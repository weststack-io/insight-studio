"use strict";
/**
 * Basic compliance guardrails for content generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRestrictedTerms = checkRestrictedTerms;
exports.checkHighRiskTerms = checkHighRiskTerms;
exports.calculateRiskScore = calculateRiskScore;
exports.getSuggestedDisclosures = getSuggestedDisclosures;
exports.injectDisclosures = injectDisclosures;
exports.runGuardrails = runGuardrails;
// Restricted terms that should trigger review
const RESTRICTED_TERMS = [
    "guaranteed return",
    "risk-free",
    "guaranteed profit",
    "no risk",
    "sure thing",
    "can't lose",
    "guaranteed income",
    "guaranteed yield",
    "guaranteed rate",
    "promise",
    "assure",
    "certain",
    "definite",
    "absolute",
    "100% safe",
    "zero risk",
    "no downside",
    "surefire",
    "foolproof",
    "bulletproof",
];
// High-risk terms that require careful handling
const HIGH_RISK_TERMS = [
    "cryptocurrency",
    "crypto",
    "bitcoin",
    "ethereum",
    "blockchain",
    "derivatives",
    "options",
    "futures",
    "leverage",
    "margin",
    "short selling",
    "hedge fund",
    "private equity",
    "venture capital",
    "penny stock",
    "speculation",
    "day trading",
];
// Standard disclosure templates
const DISCLOSURE_TEMPLATES = {
    general: "This content is for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results.",
    investment: "Investments involve risk, including the possible loss of principal. Please consult with a qualified financial advisor before making investment decisions.",
    market: "Market conditions are subject to change. This analysis reflects conditions at the time of publication and may not be current.",
    portfolio: "Portfolio performance is based on historical data and may not reflect future results. Individual results may vary.",
    cryptocurrency: "Cryptocurrency investments are highly speculative and involve significant risk. Prices can be extremely volatile.",
    derivatives: "Derivatives trading involves substantial risk and is not suitable for all investors. Please consult with a qualified advisor.",
};
/**
 * Check content for restricted terms
 */
function checkRestrictedTerms(content) {
    const violations = [];
    const lowerContent = content.toLowerCase();
    for (const term of RESTRICTED_TERMS) {
        if (lowerContent.includes(term.toLowerCase())) {
            violations.push(term);
        }
    }
    return violations;
}
/**
 * Check content for high-risk terms
 */
function checkHighRiskTerms(content) {
    const found = [];
    const lowerContent = content.toLowerCase();
    for (const term of HIGH_RISK_TERMS) {
        if (lowerContent.includes(term.toLowerCase())) {
            found.push(term);
        }
    }
    return found;
}
/**
 * Calculate basic risk score (0-100)
 */
function calculateRiskScore(content, violations, highRiskTerms) {
    let score = 0;
    // Base score from restricted terms (each violation adds 20 points)
    score += violations.length * 20;
    // High-risk terms add 5 points each
    score += highRiskTerms.length * 5;
    // Content length factor (longer content might have more issues)
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 2000) {
        score += 5;
    }
    // Check for excessive use of superlatives
    const superlatives = ["best", "worst", "amazing", "incredible", "unbelievable"];
    const superlativeCount = superlatives.filter((word) => content.toLowerCase().includes(word)).length;
    score += superlativeCount * 3;
    // Check for claims without citations (if content mentions numbers/statistics)
    const numberPattern = /\d+%/g;
    const numbers = content.match(numberPattern);
    if (numbers && numbers.length > 3) {
        score += 10; // Multiple statistics without clear citations
    }
    // Cap at 100
    return Math.min(score, 100);
}
/**
 * Determine which disclosures should be included
 */
function getSuggestedDisclosures(content, highRiskTerms) {
    const disclosures = [];
    // Always include general disclosure
    disclosures.push(DISCLOSURE_TEMPLATES.general);
    // Add investment disclosure if content discusses investments
    if (content.toLowerCase().includes("investment") ||
        content.toLowerCase().includes("invest") ||
        content.toLowerCase().includes("portfolio")) {
        disclosures.push(DISCLOSURE_TEMPLATES.investment);
    }
    // Add market disclosure if content discusses market conditions
    if (content.toLowerCase().includes("market") ||
        content.toLowerCase().includes("economic") ||
        content.toLowerCase().includes("trend")) {
        disclosures.push(DISCLOSURE_TEMPLATES.market);
    }
    // Add portfolio disclosure if content discusses portfolios
    if (content.toLowerCase().includes("portfolio")) {
        disclosures.push(DISCLOSURE_TEMPLATES.portfolio);
    }
    // Add cryptocurrency disclosure
    if (highRiskTerms.some((term) => ["cryptocurrency", "crypto", "bitcoin", "ethereum"].includes(term.toLowerCase()))) {
        disclosures.push(DISCLOSURE_TEMPLATES.cryptocurrency);
    }
    // Add derivatives disclosure
    if (highRiskTerms.some((term) => ["derivatives", "options", "futures", "leverage", "margin"].includes(term.toLowerCase()))) {
        disclosures.push(DISCLOSURE_TEMPLATES.derivatives);
    }
    // Remove duplicates
    return Array.from(new Set(disclosures));
}
/**
 * Inject disclosures into content
 */
function injectDisclosures(content, disclosures) {
    if (disclosures.length === 0) {
        return content;
    }
    const disclosureText = "\n\n---\n\n**Disclosures:**\n\n" + disclosures.join("\n\n") + "\n\n---\n\n";
    // Try to inject at the end of the content
    // If content is JSON, we need to handle it differently
    try {
        const parsed = JSON.parse(content);
        if (parsed.content) {
            parsed.content += disclosureText;
            return JSON.stringify(parsed);
        }
        else if (parsed.summary) {
            parsed.summary += disclosureText;
            return JSON.stringify(parsed);
        }
    }
    catch {
        // Not JSON, append to string
        return content + disclosureText;
    }
    return content + disclosureText;
}
/**
 * Run all guardrails on content
 */
function runGuardrails(content) {
    const violations = checkRestrictedTerms(content);
    const highRiskTerms = checkHighRiskTerms(content);
    const riskScore = calculateRiskScore(content, violations, highRiskTerms);
    const suggestedDisclosures = getSuggestedDisclosures(content, highRiskTerms);
    // Require review if:
    // - There are restricted term violations
    // - Risk score is above 50
    // - Multiple high-risk terms are present
    const requiresReview = violations.length > 0 || riskScore > 50 || highRiskTerms.length > 2;
    return {
        passed: violations.length === 0 && riskScore < 30,
        violations,
        riskScore,
        requiresReview,
        suggestedDisclosures,
    };
}
//# sourceMappingURL=guardrails.js.map
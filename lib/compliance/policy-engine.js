"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantPolicies = getTenantPolicies;
exports.getPoliciesByType = getPoliciesByType;
exports.upsertPolicy = upsertPolicy;
exports.deletePolicy = deletePolicy;
exports.evaluatePolicies = evaluatePolicies;
exports.getDefaultPolicyConfig = getDefaultPolicyConfig;
const client_1 = require("@/lib/db/client");
/**
 * Get all enabled policies for a tenant
 */
async function getTenantPolicies(tenantId) {
    const policies = await client_1.prisma.policy.findMany({
        where: {
            tenantId,
            enabled: true,
        },
    });
    return policies.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        name: p.name,
        type: p.type,
        config: JSON.parse(p.config),
        enabled: p.enabled,
    }));
}
/**
 * Get policies of a specific type for a tenant
 */
async function getPoliciesByType(tenantId, type) {
    const policies = await client_1.prisma.policy.findMany({
        where: {
            tenantId,
            type,
            enabled: true,
        },
    });
    return policies.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        name: p.name,
        type: p.type,
        config: JSON.parse(p.config),
        enabled: p.enabled,
    }));
}
/**
 * Create or update a policy
 */
async function upsertPolicy(tenantId, name, type, config, enabled = true) {
    const policy = await client_1.prisma.policy.upsert({
        where: {
            tenantId_name: {
                tenantId,
                name,
            },
        },
        update: {
            type,
            config: JSON.stringify(config),
            enabled,
            updatedAt: new Date(),
        },
        create: {
            tenantId,
            name,
            type,
            config: JSON.stringify(config),
            enabled,
        },
    });
    return {
        id: policy.id,
        tenantId: policy.tenantId,
        name: policy.name,
        type: policy.type,
        config: JSON.parse(policy.config),
        enabled: policy.enabled,
    };
}
/**
 * Delete a policy
 */
async function deletePolicy(tenantId, name) {
    await client_1.prisma.policy.delete({
        where: {
            tenantId_name: {
                tenantId,
                name,
            },
        },
    });
}
/**
 * Evaluate content against all tenant policies
 */
async function evaluatePolicies(tenantId, content, contentType, metadata) {
    const policies = await getTenantPolicies(tenantId);
    const violations = [];
    let requiresReview = false;
    let blocked = false;
    for (const policy of policies) {
        const result = evaluatePolicyRule(policy, content, contentType, metadata);
        violations.push(...result.violations);
        if (result.requiresReview)
            requiresReview = true;
        if (result.blocked)
            blocked = true;
    }
    return {
        passed: violations.length === 0 && !blocked,
        violations,
        requiresReview,
        blocked,
    };
}
/**
 * Evaluate a single policy rule
 */
function evaluatePolicyRule(policy, content, contentType, metadata) {
    const violations = [];
    let requiresReview = false;
    let blocked = false;
    switch (policy.type) {
        case "prohibited_terms":
            const termViolations = evaluateProhibitedTerms(policy, content, violations);
            if (termViolations.length > 0) {
                requiresReview = true;
                // Block if critical violations
                if (termViolations.some((v) => v.severity === "critical")) {
                    blocked = true;
                }
            }
            break;
        case "required_disclosures":
            // This is checked separately in disclosure management
            // Just ensure required disclosures are present
            break;
        case "content_restrictions":
            const restrictionViolations = evaluateContentRestrictions(policy, content, contentType, metadata, violations);
            if (restrictionViolations.length > 0) {
                requiresReview = true;
            }
            break;
        case "risk_thresholds":
            const riskResult = evaluateRiskThresholds(policy, metadata?.riskScore, violations);
            if (riskResult.requiresReview)
                requiresReview = true;
            if (riskResult.blocked)
                blocked = true;
            break;
    }
    return {
        passed: violations.length === 0 && !blocked,
        violations,
        requiresReview,
        blocked,
    };
}
/**
 * Evaluate prohibited terms policy
 */
function evaluateProhibitedTerms(policy, content, violations) {
    const prohibitedTerms = policy.config.prohibitedTerms || [];
    const lowerContent = content.toLowerCase();
    const found = [];
    for (const term of prohibitedTerms) {
        if (lowerContent.includes(term.toLowerCase())) {
            // Determine severity based on term
            let severity = "medium";
            const criticalTerms = [
                "guaranteed return",
                "risk-free",
                "guaranteed profit",
                "100% safe",
                "zero risk",
            ];
            if (criticalTerms.some((ct) => term.toLowerCase().includes(ct))) {
                severity = "critical";
            }
            found.push({
                policyId: policy.id,
                policyName: policy.name,
                policyType: "prohibited_terms",
                violation: `Prohibited term found: "${term}"`,
                severity,
                details: {
                    term,
                    position: lowerContent.indexOf(term.toLowerCase()),
                },
            });
        }
    }
    violations.push(...found);
    return found;
}
/**
 * Evaluate content restrictions policy
 */
function evaluateContentRestrictions(policy, content, contentType, metadata, violations = []) {
    const restrictions = policy.config.contentRestrictions || {};
    const found = [];
    // Check length restrictions
    const wordCount = metadata?.wordCount || content.split(/\s+/).length;
    if (restrictions.maxLength && wordCount > restrictions.maxLength) {
        found.push({
            policyId: policy.id,
            policyName: policy.name,
            policyType: "content_restrictions",
            violation: `Content exceeds maximum length: ${wordCount} words (max: ${restrictions.maxLength})`,
            severity: "low",
            details: {
                wordCount,
                maxLength: restrictions.maxLength,
            },
        });
    }
    if (restrictions.minLength && wordCount < restrictions.minLength) {
        found.push({
            policyId: policy.id,
            policyName: policy.name,
            policyType: "content_restrictions",
            violation: `Content below minimum length: ${wordCount} words (min: ${restrictions.minLength})`,
            severity: "low",
            details: {
                wordCount,
                minLength: restrictions.minLength,
            },
        });
    }
    // Check topic restrictions
    if (restrictions.blockedTopics && metadata?.topics) {
        const blockedFound = metadata.topics.filter((topic) => restrictions.blockedTopics?.some((bt) => topic.toLowerCase().includes(bt.toLowerCase())));
        if (blockedFound.length > 0) {
            found.push({
                policyId: policy.id,
                policyName: policy.name,
                policyType: "content_restrictions",
                violation: `Blocked topics found: ${blockedFound.join(", ")}`,
                severity: "high",
                details: {
                    blockedTopics: blockedFound,
                },
            });
        }
    }
    violations.push(...found);
    return found;
}
/**
 * Evaluate risk thresholds policy
 */
function evaluateRiskThresholds(policy, riskScore, violations = []) {
    if (riskScore === undefined) {
        return { requiresReview: false, blocked: false };
    }
    const thresholds = policy.config.riskThresholds || {};
    let requiresReview = false;
    let blocked = false;
    // Check if content should be blocked
    if (thresholds.blockContent && riskScore >= thresholds.blockContent) {
        violations.push({
            policyId: policy.id,
            policyName: policy.name,
            policyType: "risk_thresholds",
            violation: `Risk score ${riskScore} exceeds block threshold (${thresholds.blockContent})`,
            severity: "critical",
            details: {
                riskScore,
                blockThreshold: thresholds.blockContent,
            },
        });
        blocked = true;
    }
    // Check if content requires review
    if (thresholds.requireReview && riskScore >= thresholds.requireReview) {
        violations.push({
            policyId: policy.id,
            policyName: policy.name,
            policyType: "risk_thresholds",
            violation: `Risk score ${riskScore} exceeds review threshold (${thresholds.requireReview})`,
            severity: "high",
            details: {
                riskScore,
                reviewThreshold: thresholds.requireReview,
            },
        });
        requiresReview = true;
    }
    return { requiresReview, blocked };
}
/**
 * Get default policy configuration
 */
function getDefaultPolicyConfig(type) {
    switch (type) {
        case "prohibited_terms":
            return {
                prohibitedTerms: [
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
                ],
            };
        case "required_disclosures":
            return {
                requiredDisclosures: ["general"],
            };
        case "content_restrictions":
            return {
                contentRestrictions: {
                    maxLength: 5000,
                    minLength: 100,
                },
            };
        case "risk_thresholds":
            return {
                riskThresholds: {
                    autoApprove: 30,
                    requireReview: 50,
                    blockContent: 80,
                },
            };
        default:
            return {};
    }
}
//# sourceMappingURL=policy-engine.js.map
import { prisma } from "@/lib/db/client";

export type PolicyType =
  | "prohibited_terms"
  | "required_disclosures"
  | "content_restrictions"
  | "risk_thresholds";

export interface PolicyConfig {
  prohibitedTerms?: string[];
  requiredDisclosures?: string[];
  contentRestrictions?: {
    maxLength?: number;
    minLength?: number;
    allowedTopics?: string[];
    blockedTopics?: string[];
  };
  riskThresholds?: {
    autoApprove?: number; // Auto-approve if risk score is below this
    requireReview?: number; // Require review if risk score is above this
    blockContent?: number; // Block content if risk score is above this
  };
}

export interface PolicyRule {
  id: string;
  tenantId: string;
  name: string;
  type: PolicyType;
  config: PolicyConfig;
  enabled: boolean;
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  policyType: PolicyType;
  violation: string;
  severity: "low" | "medium" | "high" | "critical";
  details?: Record<string, any>;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  violations: PolicyViolation[];
  requiresReview: boolean;
  blocked: boolean;
}

/**
 * Get all enabled policies for a tenant
 */
export async function getTenantPolicies(
  tenantId: string
): Promise<PolicyRule[]> {
  const policies = await prisma.policy.findMany({
    where: {
      tenantId,
      enabled: true,
    },
  });

  return policies.map((p) => ({
    id: p.id,
    tenantId: p.tenantId,
    name: p.name,
    type: p.type as PolicyType,
    config: JSON.parse(p.config) as PolicyConfig,
    enabled: p.enabled,
  }));
}

/**
 * Get policies of a specific type for a tenant
 */
export async function getPoliciesByType(
  tenantId: string,
  type: PolicyType
): Promise<PolicyRule[]> {
  const policies = await prisma.policy.findMany({
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
    type: p.type as PolicyType,
    config: JSON.parse(p.config) as PolicyConfig,
    enabled: p.enabled,
  }));
}

/**
 * Create or update a policy
 */
export async function upsertPolicy(
  tenantId: string,
  name: string,
  type: PolicyType,
  config: PolicyConfig,
  enabled: boolean = true
): Promise<PolicyRule> {
  const policy = await prisma.policy.upsert({
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
    type: policy.type as PolicyType,
    config: JSON.parse(policy.config) as PolicyConfig,
    enabled: policy.enabled,
  };
}

/**
 * Delete a policy
 */
export async function deletePolicy(
  tenantId: string,
  name: string
): Promise<void> {
  await prisma.policy.delete({
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
export async function evaluatePolicies(
  tenantId: string,
  content: string,
  contentType: "briefing" | "explainer" | "lesson",
  metadata?: {
    citations?: any[];
    riskScore?: number;
    topics?: string[];
    wordCount?: number;
  }
): Promise<PolicyEvaluationResult> {
  const policies = await getTenantPolicies(tenantId);
  const violations: PolicyViolation[] = [];
  let requiresReview = false;
  let blocked = false;

  for (const policy of policies) {
    const result = evaluatePolicyRule(policy, content, contentType, metadata);
    violations.push(...result.violations);
    if (result.requiresReview) requiresReview = true;
    if (result.blocked) blocked = true;
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
function evaluatePolicyRule(
  policy: PolicyRule,
  content: string,
  contentType: "briefing" | "explainer" | "lesson",
  metadata?: {
    citations?: any[];
    riskScore?: number;
    topics?: string[];
    wordCount?: number;
  }
): PolicyEvaluationResult {
  const violations: PolicyViolation[] = [];
  let requiresReview = false;
  let blocked = false;

  switch (policy.type) {
    case "prohibited_terms":
      const termViolations = evaluateProhibitedTerms(
        policy,
        content,
        violations
      );
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
      const restrictionViolations = evaluateContentRestrictions(
        policy,
        content,
        contentType,
        metadata,
        violations
      );
      if (restrictionViolations.length > 0) {
        requiresReview = true;
      }
      break;

    case "risk_thresholds":
      const riskResult = evaluateRiskThresholds(
        policy,
        metadata?.riskScore,
        violations
      );
      if (riskResult.requiresReview) requiresReview = true;
      if (riskResult.blocked) blocked = true;
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
function evaluateProhibitedTerms(
  policy: PolicyRule,
  content: string,
  violations: PolicyViolation[]
): PolicyViolation[] {
  const prohibitedTerms = policy.config.prohibitedTerms || [];
  const lowerContent = content.toLowerCase();
  const found: PolicyViolation[] = [];

  for (const term of prohibitedTerms) {
    if (lowerContent.includes(term.toLowerCase())) {
      // Determine severity based on term
      let severity: "low" | "medium" | "high" | "critical" = "medium";
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
function evaluateContentRestrictions(
  policy: PolicyRule,
  content: string,
  contentType: "briefing" | "explainer" | "lesson",
  metadata?: {
    citations?: any[];
    riskScore?: number;
    topics?: string[];
    wordCount?: number;
  },
  violations: PolicyViolation[] = []
): PolicyViolation[] {
  const restrictions = policy.config.contentRestrictions || {};
  const found: PolicyViolation[] = [];

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
    const blockedFound = metadata.topics.filter((topic) =>
      restrictions.blockedTopics?.some((bt) =>
        topic.toLowerCase().includes(bt.toLowerCase())
      )
    );
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
function evaluateRiskThresholds(
  policy: PolicyRule,
  riskScore: number | undefined,
  violations: PolicyViolation[] = []
): { requiresReview: boolean; blocked: boolean } {
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
export function getDefaultPolicyConfig(type: PolicyType): PolicyConfig {
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


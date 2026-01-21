"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisclosureTemplates = getDisclosureTemplates;
exports.getDisclosureTemplate = getDisclosureTemplate;
exports.selectDisclosures = selectDisclosures;
exports.injectDisclosures = injectDisclosures;
exports.getTenantDisclosures = getTenantDisclosures;
const policy_engine_1 = require("./policy-engine");
// Default disclosure templates
const DEFAULT_DISCLOSURE_TEMPLATES = [
    {
        id: "general",
        name: "General Disclaimer",
        content: "This content is for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results.",
        contexts: ["all"],
        required: true,
    },
    {
        id: "investment",
        name: "Investment Risk Disclosure",
        content: "Investments involve risk, including the possible loss of principal. Please consult with a qualified financial advisor before making investment decisions.",
        contexts: ["briefing", "explainer", "investment"],
        required: false,
    },
    {
        id: "market",
        name: "Market Conditions Disclosure",
        content: "Market conditions are subject to change. This analysis reflects conditions at the time of publication and may not be current.",
        contexts: ["briefing", "market"],
        required: false,
    },
    {
        id: "portfolio",
        name: "Portfolio Performance Disclosure",
        content: "Portfolio performance is based on historical data and may not reflect future results. Individual results may vary.",
        contexts: ["briefing", "portfolio"],
        required: false,
    },
    {
        id: "cryptocurrency",
        name: "Cryptocurrency Risk Disclosure",
        content: "Cryptocurrency investments are highly speculative and involve significant risk. Prices can be extremely volatile.",
        contexts: ["cryptocurrency", "crypto", "bitcoin", "ethereum"],
        required: false,
    },
    {
        id: "derivatives",
        name: "Derivatives Risk Disclosure",
        content: "Derivatives trading involves substantial risk and is not suitable for all investors. Please consult with a qualified advisor.",
        contexts: ["derivatives", "options", "futures", "leverage", "margin"],
        required: false,
    },
    {
        id: "tax",
        name: "Tax Advice Disclosure",
        content: "This content is not intended as tax advice. Please consult with a qualified tax professional regarding your specific situation.",
        contexts: ["tax", "taxes", "taxation"],
        required: false,
    },
    {
        id: "estate",
        name: "Estate Planning Disclosure",
        content: "Estate planning involves complex legal and tax considerations. Please consult with qualified legal and tax professionals.",
        contexts: ["estate", "estate planning", "trust", "inheritance"],
        required: false,
    },
];
/**
 * Get disclosure template library
 */
function getDisclosureTemplates() {
    return DEFAULT_DISCLOSURE_TEMPLATES;
}
/**
 * Get disclosure template by ID
 */
function getDisclosureTemplate(id) {
    return (DEFAULT_DISCLOSURE_TEMPLATES.find((t) => t.id === id) || null);
}
/**
 * Select context-aware disclosures based on content analysis
 */
async function selectDisclosures(content, contentType, tenantId, metadata) {
    const selected = [];
    const lowerContent = content.toLowerCase();
    // Get tenant-specific required disclosures from policy
    let requiredDisclosureIds = [];
    if (tenantId) {
        try {
            const disclosurePolicies = await (0, policy_engine_1.getPoliciesByType)(tenantId, "required_disclosures");
            if (disclosurePolicies.length > 0) {
                requiredDisclosureIds =
                    disclosurePolicies[0].config.requiredDisclosures || [];
            }
        }
        catch (error) {
            console.error("Failed to get disclosure policies:", error);
        }
    }
    // Always include general disclosure
    const general = getDisclosureTemplate("general");
    if (general) {
        selected.push(general);
    }
    // Check content for investment-related terms
    if (lowerContent.includes("investment") ||
        lowerContent.includes("invest") ||
        lowerContent.includes("portfolio") ||
        contentType === "briefing") {
        const investment = getDisclosureTemplate("investment");
        if (investment && !selected.find((s) => s.id === investment.id)) {
            selected.push(investment);
        }
    }
    // Check for market-related content
    if (lowerContent.includes("market") ||
        lowerContent.includes("economic") ||
        lowerContent.includes("trend") ||
        contentType === "briefing") {
        const market = getDisclosureTemplate("market");
        if (market && !selected.find((s) => s.id === market.id)) {
            selected.push(market);
        }
    }
    // Check for portfolio-specific content
    if (lowerContent.includes("portfolio") || contentType === "briefing") {
        const portfolio = getDisclosureTemplate("portfolio");
        if (portfolio && !selected.find((s) => s.id === portfolio.id)) {
            selected.push(portfolio);
        }
    }
    // Check for cryptocurrency content
    const cryptoTerms = ["cryptocurrency", "crypto", "bitcoin", "ethereum", "blockchain"];
    if (cryptoTerms.some((term) => lowerContent.includes(term)) ||
        metadata?.highRiskTerms?.some((term) => cryptoTerms.some((ct) => term.toLowerCase().includes(ct)))) {
        const crypto = getDisclosureTemplate("cryptocurrency");
        if (crypto && !selected.find((s) => s.id === crypto.id)) {
            selected.push(crypto);
        }
    }
    // Check for derivatives content
    const derivativeTerms = [
        "derivatives",
        "options",
        "futures",
        "leverage",
        "margin",
        "short selling",
    ];
    if (derivativeTerms.some((term) => lowerContent.includes(term)) ||
        metadata?.highRiskTerms?.some((term) => derivativeTerms.some((dt) => term.toLowerCase().includes(dt)))) {
        const derivatives = getDisclosureTemplate("derivatives");
        if (derivatives && !selected.find((s) => s.id === derivatives.id)) {
            selected.push(derivatives);
        }
    }
    // Check for tax-related content
    if (lowerContent.includes("tax") ||
        lowerContent.includes("taxes") ||
        lowerContent.includes("taxation") ||
        metadata?.topics?.some((topic) => topic.toLowerCase().includes("tax"))) {
        const tax = getDisclosureTemplate("tax");
        if (tax && !selected.find((s) => s.id === tax.id)) {
            selected.push(tax);
        }
    }
    // Check for estate planning content
    if (lowerContent.includes("estate") ||
        lowerContent.includes("trust") ||
        lowerContent.includes("inheritance") ||
        metadata?.topics?.some((topic) => ["estate", "trust", "inheritance"].some((et) => topic.toLowerCase().includes(et)))) {
        const estate = getDisclosureTemplate("estate");
        if (estate && !selected.find((s) => s.id === estate.id)) {
            selected.push(estate);
        }
    }
    // Add tenant-required disclosures
    for (const requiredId of requiredDisclosureIds) {
        const required = getDisclosureTemplate(requiredId);
        if (required && !selected.find((s) => s.id === required.id)) {
            selected.push(required);
        }
    }
    // Remove duplicates
    const unique = Array.from(new Map(selected.map((d) => [d.id, d])).values());
    return unique;
}
/**
 * Inject disclosures into content
 */
function injectDisclosures(content, disclosures) {
    if (disclosures.length === 0) {
        return content;
    }
    const disclosureText = "\n\n---\n\n**Disclosures:**\n\n" +
        disclosures.map((d) => d.content).join("\n\n") +
        "\n\n---\n\n";
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
        else if (parsed.sections && Array.isArray(parsed.sections)) {
            // Add disclosures as a new section
            parsed.sections.push({
                heading: "Disclosures",
                content: disclosures.map((d) => d.content).join("\n\n"),
            });
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
 * Get all disclosures for a tenant (for management UI)
 */
async function getTenantDisclosures(tenantId) {
    // Get tenant-specific required disclosures from policy
    try {
        const disclosurePolicies = await (0, policy_engine_1.getPoliciesByType)(tenantId, "required_disclosures");
        if (disclosurePolicies.length > 0) {
            const requiredIds = disclosurePolicies[0].config.requiredDisclosures || [];
            return DEFAULT_DISCLOSURE_TEMPLATES.filter((t) => requiredIds.includes(t.id));
        }
    }
    catch (error) {
        console.error("Failed to get tenant disclosures:", error);
    }
    // Return default required disclosures
    return DEFAULT_DISCLOSURE_TEMPLATES.filter((t) => t.required);
}
//# sourceMappingURL=disclosures.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = validateInput;
exports.validateGeneratedContent = validateGeneratedContent;
exports.detectHallucinations = detectHallucinations;
exports.validateContent = validateContent;
/**
 * Pre-generation validation (input sanitization)
 */
function validateInput(input, contentType) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    // Check for empty input
    if (!input || input.trim().length === 0) {
        errors.push("Input cannot be empty");
        return { passed: false, errors, warnings, suggestions };
    }
    // Check for malicious content (basic XSS prevention)
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror=/i,
        /onload=/i,
        /<iframe/i,
    ];
    for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
            errors.push("Input contains potentially dangerous content");
            break;
        }
    }
    // Check input length
    const wordCount = input.split(/\s+/).length;
    if (wordCount > 10000) {
        warnings.push(`Input is very long (${wordCount} words). Consider breaking into smaller pieces.`);
    }
    if (wordCount < 10) {
        warnings.push("Input is very short. May not generate meaningful content.");
    }
    // Check for content type specific requirements
    if (contentType === "briefing") {
        if (!input.toLowerCase().includes("market") && !input.toLowerCase().includes("portfolio")) {
            suggestions.push("Briefing input should mention market or portfolio context");
        }
    }
    return {
        passed: errors.length === 0,
        errors,
        warnings,
        suggestions,
    };
}
/**
 * Post-generation validation (fact checking, citation verification)
 */
async function validateGeneratedContent(content, contentId, contentType, citations) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    // Check for citations
    if (citations.length === 0) {
        warnings.push("Content has no citations. Consider adding source references.");
    }
    else {
        // Validate citation confidence scores
        const lowConfidenceCitations = citations.filter((c) => c.confidenceScore < 0.5);
        if (lowConfidenceCitations.length > 0) {
            warnings.push(`${lowConfidenceCitations.length} citation(s) have low confidence scores (< 0.5). Review sources.`);
        }
        // Check if citations are properly linked
        const unlinkedCitations = citations.filter((c) => !c.sourceId);
        if (unlinkedCitations.length > 0) {
            warnings.push(`${unlinkedCitations.length} citation(s) are not linked to sources.`);
        }
    }
    // Check for statistical claims without citations
    const numberPattern = /\d+%/g;
    const numbers = content.match(numberPattern);
    if (numbers && numbers.length > 3 && citations.length < 2) {
        warnings.push("Content contains multiple statistics but few citations. Verify all claims are sourced.");
    }
    // Check for superlatives and strong claims
    const superlatives = [
        "best",
        "worst",
        "always",
        "never",
        "guaranteed",
        "certain",
        "definite",
    ];
    const foundSuperlatives = superlatives.filter((word) => content.toLowerCase().includes(word));
    if (foundSuperlatives.length > 3) {
        warnings.push("Content contains multiple superlatives. Ensure claims are supported by citations.");
    }
    // Check content structure
    try {
        const parsed = JSON.parse(content);
        if (contentType === "briefing") {
            if (!parsed.title || !parsed.summary) {
                errors.push("Briefing must have title and summary");
            }
            if (!parsed.sections || parsed.sections.length === 0) {
                errors.push("Briefing must have at least one section");
            }
        }
    }
    catch {
        // Not JSON, that's okay for some content types
    }
    return {
        passed: errors.length === 0,
        errors,
        warnings,
        suggestions,
    };
}
/**
 * Automated testing for hallucinations
 */
async function detectHallucinations(content, citations) {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    // Check for claims that seem unsupported
    const unsupportedPatterns = [
        /studies show/i,
        /research indicates/i,
        /experts say/i,
        /according to data/i,
    ];
    for (const pattern of unsupportedPatterns) {
        const matches = content.match(new RegExp(pattern, "gi"));
        if (matches && matches.length > 0 && citations.length === 0) {
            warnings.push(`Content makes claims (${matches.length} instances) but has no citations. Verify sources.`);
        }
    }
    // Check for specific numbers/percentages without citations
    const specificNumbers = content.match(/\d+\.\d+%/g);
    if (specificNumbers && specificNumbers.length > 0 && citations.length < specificNumbers.length) {
        warnings.push(`Content contains specific percentages (${specificNumbers.length}) but may not have sufficient citations.`);
    }
    // Check for contradictory statements (basic check)
    const contradictoryPairs = [
        ["increase", "decrease"],
        ["growing", "shrinking"],
        ["bullish", "bearish"],
        ["positive", "negative"],
    ];
    for (const [term1, term2] of contradictoryPairs) {
        if (content.toLowerCase().includes(term1) &&
            content.toLowerCase().includes(term2)) {
            suggestions.push(`Content may contain contradictory statements (${term1}/${term2}). Review for consistency.`);
        }
    }
    return {
        passed: errors.length === 0,
        errors,
        warnings,
        suggestions,
    };
}
/**
 * Comprehensive validation pipeline
 */
async function validateContent(input, generatedContent, contentId, contentType, citations) {
    // Pre-generation validation
    const inputValidation = validateInput(input, contentType);
    if (!inputValidation.passed) {
        return inputValidation;
    }
    // Post-generation validation
    const contentValidation = await validateGeneratedContent(generatedContent, contentId, contentType, citations);
    // Hallucination detection
    const hallucinationCheck = await detectHallucinations(generatedContent, citations);
    // Combine all results
    return {
        passed: inputValidation.passed &&
            contentValidation.passed &&
            hallucinationCheck.passed,
        errors: [
            ...inputValidation.errors,
            ...contentValidation.errors,
            ...hallucinationCheck.errors,
        ],
        warnings: [
            ...inputValidation.warnings,
            ...contentValidation.warnings,
            ...hallucinationCheck.warnings,
        ],
        suggestions: [
            ...inputValidation.suggestions,
            ...contentValidation.suggestions,
            ...hallucinationCheck.suggestions,
        ],
    };
}
//# sourceMappingURL=validation.js.map
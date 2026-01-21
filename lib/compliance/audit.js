"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
exports.logContentGeneration = logContentGeneration;
exports.logContentReview = logContentReview;
exports.logPolicyEvaluation = logPolicyEvaluation;
exports.logRiskScoring = logRiskScoring;
exports.searchAuditLogs = searchAuditLogs;
exports.getAuditLog = getAuditLog;
exports.cleanupOldAuditLogs = cleanupOldAuditLogs;
exports.exportAuditLogs = exportAuditLogs;
const storage_1 = require("@/lib/azure/storage");
const AUDIT_CONTAINER = "audit-logs";
const RETENTION_DAYS = 365; // 1 year retention
/**
 * Log an audit event
 */
async function logAuditEvent(tenantId, eventType, metadata, options) {
    const log = {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        tenantId,
        userId: options?.userId,
        eventType,
        timestamp: new Date(),
        metadata,
        input: options?.input,
        output: options?.output,
        result: options?.result || "success",
        error: options?.error,
    };
    // Store in Azure Blob Storage
    const blobName = `${tenantId}/${eventType}/${log.timestamp.toISOString().split("T")[0]}/${log.id}.json`;
    try {
        await (0, storage_1.uploadBlob)(AUDIT_CONTAINER, blobName, JSON.stringify(log, null, 2), "application/json");
        return log.id;
    }
    catch (error) {
        console.error("Failed to log audit event:", error);
        // Don't throw - audit logging should not break the application
        return log.id;
    }
}
/**
 * Log content generation event
 */
async function logContentGeneration(tenantId, userId, contentType, contentId, prompt, generatedContent, metadata) {
    return await logAuditEvent(tenantId, "content_generation", {
        contentId,
        contentType,
        ...metadata,
    }, {
        userId,
        input: {
            prompt: prompt.substring(0, 1000), // Truncate for storage
            contentType,
        },
        output: {
            contentLength: generatedContent.length,
            wordCount: generatedContent.split(/\s+/).length,
            riskScore: metadata?.riskScore,
            citationCount: metadata?.citations?.length || 0,
        },
        result: "success",
    });
}
/**
 * Log content review event
 */
async function logContentReview(tenantId, reviewerId, contentId, contentType, action, comments) {
    return await logAuditEvent(tenantId, "content_review", {
        contentId,
        contentType,
        action,
    }, {
        userId: reviewerId,
        input: {
            action,
            comments: comments?.substring(0, 500), // Truncate
        },
        result: "success",
    });
}
/**
 * Log policy evaluation event
 */
async function logPolicyEvaluation(tenantId, contentId, contentType, violations, requiresReview, blocked) {
    return await logAuditEvent(tenantId, "policy_evaluation", {
        contentId,
        contentType,
    }, {
        input: {
            violationCount: violations.length,
        },
        output: {
            violations,
            requiresReview,
            blocked,
        },
        result: blocked ? "failure" : requiresReview ? "warning" : "success",
    });
}
/**
 * Log risk scoring event
 */
async function logRiskScoring(tenantId, contentId, contentType, riskScore, factors) {
    return await logAuditEvent(tenantId, "risk_scoring", {
        contentId,
        contentType,
    }, {
        input: {
            contentType,
        },
        output: {
            riskScore,
            factors,
        },
        result: riskScore >= 50 ? "warning" : "success",
    });
}
/**
 * Search audit logs
 */
async function searchAuditLogs(tenantId, filters, limit = 100) {
    // Note: Azure Blob Storage doesn't have native search
    // For production, consider using Azure Search or Cosmos DB
    // For now, we'll return a simplified implementation
    // This is a placeholder - in production, you'd want to:
    // 1. List blobs in the tenant's folder
    // 2. Filter by date range
    // 3. Download and parse relevant logs
    // 4. Filter in memory (not scalable for large datasets)
    console.warn("Audit log search is simplified. For production, consider using Azure Search or Cosmos DB.");
    // Return empty array for now - full implementation would require
    // listing and filtering blobs, which is complex
    return [];
}
/**
 * Get audit log by ID
 */
async function getAuditLog(tenantId, logId) {
    try {
        // Find the log by searching through date folders
        // This is simplified - in production, maintain an index
        const today = new Date();
        const datesToCheck = [];
        // Check last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            datesToCheck.push(date.toISOString().split("T")[0]);
        }
        for (const dateStr of datesToCheck) {
            try {
                const blobName = `${tenantId}/*/${dateStr}/${logId}.json`;
                // Note: This won't work with wildcards - would need to list and search
                // For now, return null
            }
            catch {
                // Continue searching
            }
        }
        return null;
    }
    catch (error) {
        console.error("Failed to get audit log:", error);
        return null;
    }
}
/**
 * Clean up old audit logs (retention policy)
 */
async function cleanupOldAuditLogs(tenantId) {
    // This would need to:
    // 1. List all blobs in audit container
    // 2. Check modification dates
    // 3. Delete logs older than RETENTION_DAYS
    // 4. Return count of deleted logs
    // For now, return 0 - full implementation would require blob listing
    console.warn("Audit log cleanup not fully implemented. Use Azure Lifecycle Management policies.");
    return 0;
}
/**
 * Export audit logs for compliance reporting
 */
async function exportAuditLogs(tenantId, startDate, endDate) {
    // This would:
    // 1. List blobs in date range
    // 2. Download and parse logs
    // 3. Return array of logs
    // Simplified implementation
    return [];
}
//# sourceMappingURL=audit.js.map
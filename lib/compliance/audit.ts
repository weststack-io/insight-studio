import { uploadBlob, downloadBlob, deleteBlob } from "@/lib/azure/storage";

export type AuditEventType =
  | "content_generation"
  | "content_review"
  | "policy_evaluation"
  | "risk_scoring"
  | "citation_extraction"
  | "disclosure_injection"
  | "content_validation"
  | "user_action";

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  eventType: AuditEventType;
  timestamp: Date;
  metadata: {
    contentId?: string;
    contentType?: "briefing" | "explainer" | "lesson";
    action?: string;
    [key: string]: any;
  };
  input?: any;
  output?: any;
  result?: "success" | "failure" | "warning";
  error?: string;
}

const AUDIT_CONTAINER = "audit-logs";
const RETENTION_DAYS = 365; // 1 year retention

/**
 * Log an audit event
 */
export async function logAuditEvent(
  tenantId: string,
  eventType: AuditEventType,
  metadata: AuditLog["metadata"],
  options?: {
    userId?: string;
    input?: any;
    output?: any;
    result?: "success" | "failure" | "warning";
    error?: string;
  }
): Promise<string> {
  const log: AuditLog = {
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
    await uploadBlob(
      AUDIT_CONTAINER,
      blobName,
      JSON.stringify(log, null, 2),
      "application/json"
    );
    return log.id;
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging should not break the application
    return log.id;
  }
}

/**
 * Log content generation event
 */
export async function logContentGeneration(
  tenantId: string,
  userId: string,
  contentType: "briefing" | "explainer" | "lesson",
  contentId: string,
  prompt: string,
  generatedContent: string,
  metadata?: {
    riskScore?: number;
    citations?: any[];
    [key: string]: any;
  }
): Promise<string> {
  return await logAuditEvent(
    tenantId,
    "content_generation",
    {
      contentId,
      contentType,
      ...metadata,
    },
    {
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
    }
  );
}

/**
 * Log content review event
 */
export async function logContentReview(
  tenantId: string,
  reviewerId: string,
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson",
  action: "approved" | "rejected" | "changes_requested",
  comments?: string
): Promise<string> {
  return await logAuditEvent(
    tenantId,
    "content_review",
    {
      contentId,
      contentType,
      action,
    },
    {
      userId: reviewerId,
      input: {
        action,
        comments: comments?.substring(0, 500), // Truncate
      },
      result: "success",
    }
  );
}

/**
 * Log policy evaluation event
 */
export async function logPolicyEvaluation(
  tenantId: string,
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson",
  violations: any[],
  requiresReview: boolean,
  blocked: boolean
): Promise<string> {
  return await logAuditEvent(
    tenantId,
    "policy_evaluation",
    {
      contentId,
      contentType,
    },
    {
      input: {
        violationCount: violations.length,
      },
      output: {
        violations,
        requiresReview,
        blocked,
      },
      result: blocked ? "failure" : requiresReview ? "warning" : "success",
    }
  );
}

/**
 * Log risk scoring event
 */
export async function logRiskScoring(
  tenantId: string,
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson",
  riskScore: number,
  factors: any
): Promise<string> {
  return await logAuditEvent(
    tenantId,
    "risk_scoring",
    {
      contentId,
      contentType,
    },
    {
      input: {
        contentType,
      },
      output: {
        riskScore,
        factors,
      },
      result: riskScore >= 50 ? "warning" : "success",
    }
  );
}

/**
 * Search audit logs
 */
export async function searchAuditLogs(
  tenantId: string,
  filters?: {
    eventType?: AuditEventType;
    userId?: string;
    contentId?: string;
    startDate?: Date;
    endDate?: Date;
    result?: "success" | "failure" | "warning";
  },
  limit: number = 100
): Promise<AuditLog[]> {
  // Note: Azure Blob Storage doesn't have native search
  // For production, consider using Azure Search or Cosmos DB
  // For now, we'll return a simplified implementation
  
  // This is a placeholder - in production, you'd want to:
  // 1. List blobs in the tenant's folder
  // 2. Filter by date range
  // 3. Download and parse relevant logs
  // 4. Filter in memory (not scalable for large datasets)
  
  console.warn(
    "Audit log search is simplified. For production, consider using Azure Search or Cosmos DB."
  );
  
  // Return empty array for now - full implementation would require
  // listing and filtering blobs, which is complex
  return [];
}

/**
 * Get audit log by ID
 */
export async function getAuditLog(
  tenantId: string,
  logId: string
): Promise<AuditLog | null> {
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
      } catch {
        // Continue searching
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to get audit log:", error);
    return null;
  }
}

/**
 * Clean up old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(tenantId?: string): Promise<number> {
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
export async function exportAuditLogs(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<AuditLog[]> {
  // This would:
  // 1. List blobs in date range
  // 2. Download and parse logs
  // 3. Return array of logs
  
  // Simplified implementation
  return [];
}


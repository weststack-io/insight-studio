import { PrismaClient } from "@prisma/client";
import { createMssqlAdapter } from "../db/adapter";
import { SearchResult } from "../azure/search";

// Lazy-initialize Prisma client
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: createMssqlAdapter(),
    });
  }
  return prisma;
}

export interface Citation {
  id?: string;
  contentId: string;
  contentType: "briefing" | "explainer" | "lesson";
  sourceId?: string;
  text: string;
  confidenceScore: number;
  position?: number;
  source?: {
    id: string;
    title: string;
    url?: string;
    type: string;
    date?: string;
  };
}

export interface CitationSource {
  id?: string;
  type: "research" | "news" | "market_data" | "document" | "manager_meeting";
  title: string;
  url?: string;
  date?: Date;
  reliabilityScore?: number;
  tags?: string[];
  tenantId?: string;
}

/**
 * Extract citations from RAG search results with full metadata
 */
export async function extractCitations(
  content: string,
  searchResults: SearchResult[],
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson",
  tenantId?: string
): Promise<Citation[]> {
  const db = getPrismaClient();
  const citations: Citation[] = [];

  for (const result of searchResults) {
    // Calculate confidence score based on search result score
    // Normalize score from 0-1 range (Azure Search scores are typically 0-4+)
    const confidenceScore = Math.min(result.score / 4, 1);

    // Extract source information from metadata
    // Field mapping: Azure Search index uses Name, DocumentDate, FirmName, DocType
    const metadata = result.metadata || {};
    const sourceTitle = metadata.Name || metadata.Title || metadata.title || metadata.source || "Unknown Source";
    const sourceUrl = metadata.url || metadata.sourceUrl || metadata.DocumentUrl;
    const sourceType = metadata.DocType || metadata.Type || metadata.type || "document";
    const sourceDate = metadata.DocumentDate || metadata.MeetingDate || metadata.date || metadata.Date;
    const firmName = metadata.FirmName;

    // Find or create content source
    let sourceId: string | undefined;
    if (tenantId) {
      // Try to find existing source by title (for manager meetings, title is usually unique)
      let source = await db.contentSource.findFirst({
        where: {
          title: sourceTitle,
          tenantId,
        },
      });

      if (!source && sourceUrl) {
        source = await db.contentSource.findFirst({
          where: {
            url: sourceUrl,
            tenantId,
          },
        });
      }

      if (source) {
        // Update existing source
        source = await db.contentSource.update({
          where: { id: source.id },
          data: {
            title: sourceTitle,
            url: sourceUrl,
            type: sourceType,
            date: sourceDate ? new Date(sourceDate) : source.date,
            reliabilityScore: metadata.reliabilityScore || source.reliabilityScore || 0.8,
            tags: metadata.tags ? JSON.stringify(metadata.tags) : source.tags,
          },
        });
        sourceId = source.id;
      } else {
        // Create new source
        source = await db.contentSource.create({
          data: {
            type: sourceType,
            title: sourceTitle,
            url: sourceUrl,
            date: sourceDate ? new Date(sourceDate) : new Date(),
            reliabilityScore: metadata.reliabilityScore || 0.8,
            tags: metadata.tags ? JSON.stringify(metadata.tags) : null,
            tenantId,
          },
        });
        sourceId = source.id;
      }
    }

    // Find position in content where this citation should appear
    const keyPhrases = extractKeyPhrases(result.content);
    let position: number | undefined;
    for (const phrase of keyPhrases) {
      const index = content.toLowerCase().indexOf(phrase.toLowerCase());
      if (index !== -1) {
        position = index;
        break;
      }
    }

    // Create citation
    const citation: Citation = {
      contentId,
      contentType,
      sourceId,
      text: result.content.substring(0, 300), // First 300 chars as citation text
      confidenceScore,
      position,
      source: sourceId
        ? {
            id: sourceId,
            title: sourceTitle,
            url: sourceUrl,
            type: sourceType,
            date: sourceDate,
          }
        : undefined,
    };

    citations.push(citation);
  }

  return citations;
}

/**
 * Store citations in database
 */
export async function storeCitations(
  citations: Citation[]
): Promise<Citation[]> {
  const db = getPrismaClient();
  const storedCitations: Citation[] = [];

  for (const citation of citations) {
    try {
      const stored = await db.citation.create({
        data: {
          contentId: citation.contentId,
          contentType: citation.contentType,
          sourceId: citation.sourceId,
          text: citation.text,
          confidenceScore: citation.confidenceScore,
          position: citation.position,
        },
        include: {
          source: true,
        },
      });

      storedCitations.push({
        id: stored.id,
        contentId: stored.contentId,
        contentType: stored.contentType as "briefing" | "explainer" | "lesson",
        sourceId: stored.sourceId || undefined,
        text: stored.text,
        confidenceScore: stored.confidenceScore,
        position: stored.position || undefined,
        source: stored.source
          ? {
              id: stored.source.id,
              title: stored.source.title,
              url: stored.source.url || undefined,
              type: stored.source.type,
              date: stored.source.date?.toISOString(),
            }
          : undefined,
      });
    } catch (error) {
      console.error(`Failed to store citation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return storedCitations;
}

/**
 * Get citations for content
 */
export async function getCitations(
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson"
): Promise<Citation[]> {
  const db = getPrismaClient();

  const citations = await db.citation.findMany({
    where: {
      contentId,
      contentType,
    },
    include: {
      source: true,
    },
    orderBy: {
      position: "asc",
    },
  });

  return citations.map((c) => ({
    id: c.id,
    contentId: c.contentId,
    contentType: c.contentType as "briefing" | "explainer" | "lesson",
    sourceId: c.sourceId || undefined,
    text: c.text,
    confidenceScore: c.confidenceScore,
    position: c.position || undefined,
    source: c.source
      ? {
          id: c.source.id,
          title: c.source.title,
          url: c.source.url || undefined,
          type: c.source.type,
          date: c.source.date?.toISOString(),
        }
      : undefined,
  }));
}

/**
 * Update citations JSON field on briefing record
 */
export async function updateBriefingCitations(
  briefingId: string,
  citations: Citation[]
): Promise<void> {
  const db = getPrismaClient();

  const citationsJson = JSON.stringify(
    citations.map((c) => ({
      sourceTitle: c.source?.title,
      sourceType: c.source?.type,
      sourceDate: c.source?.date,
      confidenceScore: c.confidenceScore,
      text: c.text.substring(0, 150),
    }))
  );

  await db.briefing.update({
    where: { id: briefingId },
    data: { citations: citationsJson },
  });
}

/**
 * Format citations for display in briefing
 */
export function formatCitationsForDisplay(citations: Citation[]): string {
  if (citations.length === 0) {
    return "";
  }

  const lines: string[] = ["\n---\nSources:"];

  // Deduplicate by source title
  const seenTitles = new Set<string>();
  const uniqueCitations = citations.filter((c) => {
    const title = c.source?.title || "Unknown";
    if (seenTitles.has(title)) return false;
    seenTitles.add(title);
    return true;
  });

  for (let i = 0; i < uniqueCitations.length; i++) {
    const citation = uniqueCitations[i];
    const sourceTitle = citation.source?.title || "Unknown Source";
    const sourceDate = citation.source?.date
      ? new Date(citation.source.date).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : "";
    const sourceType = citation.source?.type || "document";

    lines.push(
      `[${i + 1}] ${sourceTitle}${sourceDate ? ` (${sourceDate})` : ""} - ${sourceType}`
    );
  }

  return lines.join("\n");
}

/**
 * Format search results with source metadata for prompt inclusion
 */
export function formatSourcesForPrompt(searchResults: SearchResult[]): string {
  if (searchResults.length === 0) {
    return "No proprietary sources available.";
  }

  const lines: string[] = ["Proprietary Insights (cite these sources using [Source: Title]):"];

  for (const result of searchResults) {
    // Field mapping: Azure Search index uses Name, DocumentDate, FirmName, DocType
    const metadata = result.metadata || {};
    const title = metadata.Name || metadata.Title || metadata.title || "Unknown Document";
    const firmName = metadata.FirmName;
    const date = metadata.DocumentDate || metadata.MeetingDate || metadata.date;
    const dateStr = date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

    const sourceLabel = firmName ? `${title} - ${firmName}` : title;
    lines.push(`\nFrom "${sourceLabel}"${dateStr ? ` (${dateStr})` : ""}:`);
    lines.push(result.content.substring(0, 500));
  }

  return lines.join("\n");
}

/**
 * Extract key phrases from content for position detection
 */
function extractKeyPhrases(content: string, maxLength = 50): string[] {
  const sentences = content.split(/[.!?]\s+/);
  const phrases: string[] = [];

  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    if (firstSentence.length > 0) {
      phrases.push(firstSentence.substring(0, maxLength));
    }
  }

  if (content.length > 0) {
    phrases.push(content.substring(0, maxLength));
  }

  return phrases;
}

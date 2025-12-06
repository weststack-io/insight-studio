import { SearchResult } from "@/lib/azure/search";
import { prisma } from "@/lib/db/client";

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
  };
}

export interface CitationSource {
  id?: string;
  type: "research" | "news" | "market_data" | "document";
  title: string;
  url?: string;
  date?: Date;
  reliabilityScore?: number;
  tags?: string[];
  tenantId?: string;
}

/**
 * Extract citations from RAG search results
 */
export async function extractCitations(
  content: string,
  searchResults: SearchResult[],
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson",
  tenantId?: string
): Promise<Citation[]> {
  const citations: Citation[] = [];

  for (const result of searchResults) {
    // Calculate confidence score based on search result score
    // Normalize score from 0-1 range (assuming Azure Search scores are typically 0-4)
    const confidenceScore = Math.min(result.score / 4, 1);

    // Extract source information from metadata
    const metadata = result.metadata || {};
    const sourceTitle = metadata.title || metadata.source || "Unknown Source";
    const sourceUrl = metadata.url || metadata.sourceUrl;
    const sourceType = metadata.type || "document";

    // Find or create content source
    let sourceId: string | undefined;
    if (tenantId) {
      // Try to find existing source by URL or title
      let source = null;
      if (sourceUrl) {
        source = await prisma.contentSource.findFirst({
          where: {
            url: sourceUrl,
            tenantId,
          },
        });
      }
      
      if (!source) {
        source = await prisma.contentSource.findFirst({
          where: {
            title: sourceTitle,
            tenantId,
          },
        });
      }

      if (source) {
        // Update existing source
        source = await prisma.contentSource.update({
          where: { id: source.id },
          data: {
            title: sourceTitle,
            url: sourceUrl,
            type: sourceType,
            reliabilityScore: metadata.reliabilityScore || source.reliabilityScore || 0.7,
            tags: metadata.tags ? JSON.stringify(metadata.tags) : source.tags,
          },
        });
        sourceId = source.id;
      } else {
        // Create new source
        source = await prisma.contentSource.create({
          data: {
            type: sourceType,
            title: sourceTitle,
            url: sourceUrl,
            date: metadata.date ? new Date(metadata.date) : new Date(),
            reliabilityScore: metadata.reliabilityScore || 0.7,
            tags: metadata.tags ? JSON.stringify(metadata.tags) : null,
            tenantId,
          },
        });
        sourceId = source.id;
      }
    }

    // Find position in content where this citation should appear
    // Simple approach: find first occurrence of key phrases from search result
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
      text: result.content.substring(0, 200), // First 200 chars as citation text
      confidenceScore,
      position,
      source: sourceId
        ? {
            id: sourceId,
            title: sourceTitle,
            url: sourceUrl,
            type: sourceType,
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
  const storedCitations: Citation[] = [];

  for (const citation of citations) {
    const stored = await prisma.citation.create({
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
          }
        : undefined,
    });
  }

  return storedCitations;
}

/**
 * Validate citation links and confidence scores
 */
export async function validateCitations(
  citations: Citation[]
): Promise<{ valid: Citation[]; invalid: Citation[] }> {
  const valid: Citation[] = [];
  const invalid: Citation[] = [];

  for (const citation of citations) {
    // Check confidence score threshold (minimum 0.5)
    if (citation.confidenceScore < 0.5) {
      invalid.push(citation);
      continue;
    }

    // Validate source exists if sourceId is provided
    if (citation.sourceId) {
      const source = await prisma.contentSource.findUnique({
        where: { id: citation.sourceId },
      });
      if (!source) {
        invalid.push(citation);
        continue;
      }
    }

    // Validate text is not empty
    if (!citation.text || citation.text.trim().length === 0) {
      invalid.push(citation);
      continue;
    }

    valid.push(citation);
  }

  return { valid, invalid };
}

/**
 * Get citations for content
 */
export async function getCitations(
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson"
): Promise<Citation[]> {
  const citations = await prisma.citation.findMany({
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
        }
      : undefined,
  }));
}

/**
 * Update citations JSON field on content model
 */
export async function updateContentCitations(
  contentId: string,
  contentType: "briefing" | "explainer" | "lesson",
  citations: Citation[]
): Promise<void> {
  const citationsJson = JSON.stringify(citations);

  if (contentType === "briefing") {
    await prisma.briefing.update({
      where: { id: contentId },
      data: { citations: citationsJson },
    });
  } else if (contentType === "explainer") {
    await prisma.explainer.update({
      where: { id: contentId },
      data: { citations: citationsJson },
    });
  } else if (contentType === "lesson") {
    await prisma.lesson.update({
      where: { id: contentId },
      data: { citations: citationsJson },
    });
  }
}

/**
 * Extract key phrases from content for position detection
 */
function extractKeyPhrases(content: string, maxLength = 50): string[] {
  // Extract first sentence or first 50 characters
  const sentences = content.split(/[.!?]\s+/);
  const phrases: string[] = [];

  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    if (firstSentence.length > 0) {
      phrases.push(firstSentence.substring(0, maxLength));
    }
  }

  // Also add first 50 characters
  if (content.length > 0) {
    phrases.push(content.substring(0, maxLength));
  }

  return phrases;
}


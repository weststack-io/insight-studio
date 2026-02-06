import { PrismaClient } from "@prisma/client";
import Parser from "rss-parser";
import { createMssqlAdapter } from "../db/adapter";

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});
const parser = new Parser();

export interface RSSFeedConfig {
  url: string;
  title?: string;
  tags?: string[];
  reliabilityScore?: number;
}

export interface PDFSourceConfig {
  url: string;
  title: string;
  tags?: string[];
  reliabilityScore?: number;
}

export interface SourceReliabilityScore {
  sourceId: string;
  score: number; // 0-1
  factors: {
    freshness?: number;
    authority?: number;
    consistency?: number;
    citationCount?: number;
  };
}

/**
 * Ingest RSS feed and create content sources
 */
export async function ingestRSSFeed(
  config: RSSFeedConfig,
  tenantId?: string,
): Promise<{ success: boolean; itemsCreated: number; errors?: string[] }> {
  const errors: string[] = [];
  let itemsCreated = 0;

  try {
    console.log(`Fetching RSS feed: ${config.url}`);
    const feed = await parser.parseURL(config.url);

    if (!feed.items || feed.items.length === 0) {
      return {
        success: true,
        itemsCreated: 0,
        errors: ["No items found in RSS feed"],
      };
    }

    console.log(`Found ${feed.items.length} items in RSS feed`);

    for (const item of feed.items) {
      try {
        // Check if source already exists by URL
        const existing = await prisma.contentSource.findFirst({
          where: {
            url: item.link || undefined,
            tenantId: tenantId || null,
          },
        });

        if (existing) {
          // Update existing source
          await prisma.contentSource.update({
            where: { id: existing.id },
            data: {
              title: item.title || config.title || "Untitled",
              date: item.pubDate ? new Date(item.pubDate) : new Date(),
              tags: config.tags ? JSON.stringify(config.tags) : null,
              reliabilityScore: config.reliabilityScore || 0.7,
              updatedAt: new Date(),
            },
          });
          console.log(`Updated existing source: ${item.title}`);
          continue;
        }

        // Create new source
        await prisma.contentSource.create({
          data: {
            type: "news",
            title: item.title || config.title || "Untitled",
            url: item.link || undefined,
            date: item.pubDate ? new Date(item.pubDate) : new Date(),
            tags: config.tags ? JSON.stringify(config.tags) : null,
            reliabilityScore: config.reliabilityScore || 0.7,
            tenantId: tenantId || null,
          },
        });

        itemsCreated++;
        console.log(`Created new source: ${item.title}`);
      } catch (error) {
        errors.push(
          `Failed to process RSS item "${item.title}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    console.log(
      `RSS ingestion completed: ${itemsCreated} items created, ${errors.length} errors`,
    );

    return {
      success: errors.length === 0,
      itemsCreated,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    throw new Error(
      `Failed to ingest RSS feed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Create a PDF/document source (actual parsing would require additional libraries)
 */
export async function createPDFSource(
  config: PDFSourceConfig,
  tenantId?: string,
): Promise<string> {
  try {
    const source = await prisma.contentSource.create({
      data: {
        type: "document",
        title: config.title,
        url: config.url,
        date: new Date(),
        tags: config.tags ? JSON.stringify(config.tags) : null,
        reliabilityScore: config.reliabilityScore || 0.8,
        tenantId: tenantId || null,
      },
    });

    return source.id;
  } catch (error) {
    throw new Error(
      `Failed to create PDF source: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Calculate reliability score for a content source
 */
export async function calculateReliabilityScore(
  sourceId: string,
): Promise<SourceReliabilityScore> {
  const source = await prisma.contentSource.findUnique({
    where: { id: sourceId },
    include: {
      citations: true,
    },
  });

  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  const factors: SourceReliabilityScore["factors"] = {};

  // Freshness factor (0-1): newer content is more reliable
  if (source.date) {
    const daysSincePublication =
      (Date.now() - source.date.getTime()) / (1000 * 60 * 60 * 24);
    factors.freshness = Math.max(0, 1 - daysSincePublication / 365); // Decay over 1 year
  } else {
    factors.freshness = 0.5;
  }

  // Authority factor: based on existing reliability score
  factors.authority = source.reliabilityScore || 0.5;

  // Consistency factor: based on citation count (more citations = more reliable)
  const citationCount = source.citations.length;
  factors.citationCount = citationCount;
  factors.consistency = Math.min(1, citationCount / 10); // Max at 10 citations

  // Weighted average
  const score =
    (factors.freshness || 0) * 0.2 +
    (factors.authority || 0) * 0.5 +
    (factors.consistency || 0) * 0.3;

  // Update source with calculated score
  await prisma.contentSource.update({
    where: { id: sourceId },
    data: {
      reliabilityScore: score,
    },
  });

  return {
    sourceId,
    score,
    factors,
  };
}

/**
 * Get all content sources for a tenant
 */
export async function getContentSources(
  tenantId?: string,
  options: {
    type?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<any[]> {
  const { type, limit = 100, offset = 0 } = options;

  const where: any = {};

  if (tenantId) {
    where.tenantId = tenantId;
  }

  if (type) {
    where.type = type;
  }

  const sources = await prisma.contentSource.findMany({
    where,
    orderBy: {
      date: "desc",
    },
    take: limit,
    skip: offset,
  });

  return sources.map((source) => ({
    ...source,
    tags: source.tags ? JSON.parse(source.tags) : [],
  }));
}

/**
 * Update source metadata
 */
export async function updateSourceMetadata(
  sourceId: string,
  metadata: Record<string, string>,
): Promise<void> {
  try {
    // Delete existing metadata for this source
    await prisma.sourceMetadata.deleteMany({
      where: { sourceId },
    });

    // Create new metadata entries
    await prisma.sourceMetadata.createMany({
      data: Object.entries(metadata).map(([key, value]) => ({
        sourceId,
        key,
        value,
      })),
    });
  } catch (error) {
    throw new Error(
      `Failed to update source metadata: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Get source metadata
 */
export async function getSourceMetadata(
  sourceId: string,
): Promise<Record<string, string>> {
  const metadata = await prisma.sourceMetadata.findMany({
    where: { sourceId },
  });

  const result: Record<string, string> = {};
  for (const item of metadata) {
    result[item.key] = item.value;
  }

  return result;
}

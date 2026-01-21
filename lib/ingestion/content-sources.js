"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestRSSFeed = ingestRSSFeed;
exports.createPDFSource = createPDFSource;
exports.calculateReliabilityScore = calculateReliabilityScore;
exports.getContentSources = getContentSources;
exports.updateSourceMetadata = updateSourceMetadata;
exports.getSourceMetadata = getSourceMetadata;
const client_1 = require("@prisma/client");
const rss_parser_1 = __importDefault(require("rss-parser"));
const adapter_1 = require("@/lib/db/adapter");
const prisma = new client_1.PrismaClient({
    adapter: (0, adapter_1.createMssqlAdapter)(),
});
const parser = new rss_parser_1.default();
/**
 * Ingest RSS feed and create content sources
 */
async function ingestRSSFeed(config, tenantId) {
    const errors = [];
    let itemsCreated = 0;
    try {
        const feed = await parser.parseURL(config.url);
        if (!feed.items || feed.items.length === 0) {
            return {
                success: true,
                itemsCreated: 0,
                errors: ["No items found in RSS feed"],
            };
        }
        for (const item of feed.items) {
            try {
                // Check if source already exists
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
            }
            catch (error) {
                errors.push(`Failed to process RSS item: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return {
            success: errors.length === 0,
            itemsCreated,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    catch (error) {
        throw new Error(`Failed to ingest RSS feed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Create a PDF/document source (actual parsing would require additional libraries)
 */
async function createPDFSource(config, tenantId) {
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
    }
    catch (error) {
        throw new Error(`Failed to create PDF source: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Calculate reliability score for a content source
 */
async function calculateReliabilityScore(sourceId) {
    const source = await prisma.contentSource.findUnique({
        where: { id: sourceId },
        include: {
            citations: true,
        },
    });
    if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
    }
    const factors = {};
    // Freshness factor (0-1): newer content is more reliable
    if (source.date) {
        const daysSincePublication = (Date.now() - source.date.getTime()) / (1000 * 60 * 60 * 24);
        factors.freshness = Math.max(0, 1 - daysSincePublication / 365); // Decay over 1 year
    }
    else {
        factors.freshness = 0.5;
    }
    // Authority factor: based on existing reliability score
    factors.authority = source.reliabilityScore || 0.5;
    // Consistency factor: based on citation count (more citations = more reliable)
    const citationCount = source.citations.length;
    factors.citationCount = citationCount;
    factors.consistency = Math.min(1, citationCount / 10); // Max at 10 citations
    // Weighted average
    const score = (factors.freshness || 0) * 0.2 +
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
async function getContentSources(tenantId, options = {}) {
    const { type, limit = 100, offset = 0 } = options;
    const where = {};
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
async function updateSourceMetadata(sourceId, metadata) {
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
    }
    catch (error) {
        throw new Error(`Failed to update source metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get source metadata
 */
async function getSourceMetadata(sourceId) {
    const metadata = await prisma.sourceMetadata.findMany({
        where: { sourceId },
    });
    const result = {};
    for (const item of metadata) {
        result[item.key] = item.value;
    }
    return result;
}
//# sourceMappingURL=content-sources.js.map
import { getSearchClient } from "../azure/search";
import { PrismaClient } from "@prisma/client";
import { getOpenAIClient } from "../azure/openai";

const prisma = new PrismaClient();

export interface IndexableContent {
  id: string;
  content: string;
  title?: string;
  type: string; // briefing, explainer, lesson, market_data, news, document
  metadata?: {
    date?: string;
    source?: string;
    assetClass?: string;
    tenantId?: string;
    [key: string]: any;
  };
}

export interface IndexingResult {
  success: boolean;
  indexed: number;
  errors?: string[];
}

/**
 * Generate embeddings for content using Azure OpenAI
 * Note: This requires an embedding deployment in Azure OpenAI
 */
export async function generateEmbedding(
  text: string
): Promise<number[]> {
  const client = getOpenAIClient();
  const deploymentName =
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME || "text-embedding-ada-002";

  try {
    // Azure OpenAI embeddings API
    const response = await client.embeddings.create({
      model: deploymentName,
      input: text.substring(0, 8000), // Limit text length for embeddings
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    }

    throw new Error("No embedding data returned");
  } catch (error) {
    // If embedding generation fails, return empty array and log warning
    // The search index can still work with keyword search
    console.warn(
      `Failed to generate embedding (search will use keyword-only): ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return [];
  }
}

/**
 * Index content to Azure AI Search with metadata
 */
export async function indexContent(
  content: IndexableContent
): Promise<void> {
  const searchClient = getSearchClient();

  try {
    // Generate embedding for the content (optional - search can work without it)
    const embeddingText = content.title
      ? `${content.title}\n\n${content.content}`
      : content.content;
    const embedding = await generateEmbedding(embeddingText);

    // Prepare document for indexing
    const document: any = {
      id: content.id,
      content: content.content,
      title: content.title || "",
      type: content.type,
    };

    // Only add embedding if it was successfully generated
    if (embedding.length > 0) {
      document.embedding = embedding;
    }

    // Add metadata fields
    if (content.metadata) {
      if (content.metadata.date) {
        document.date = content.metadata.date;
      }
      if (content.metadata.source) {
        document.source = content.metadata.source;
      }
      if (content.metadata.assetClass) {
        document.assetClass = content.metadata.assetClass;
      }
      if (content.metadata.tenantId) {
        document.tenantId = content.metadata.tenantId;
      }

      // Add any additional metadata fields
      Object.entries(content.metadata).forEach(([key, value]) => {
        if (
          !["date", "source", "assetClass", "tenantId"].includes(key) &&
          value !== undefined &&
          value !== null
        ) {
          document[`metadata_${key}`] = String(value);
        }
      });
    }

    // Upload document to search index
    await searchClient.uploadDocuments([document]);
  } catch (error) {
    throw new Error(
      `Failed to index content: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Batch index multiple content items
 */
export async function batchIndexContent(
  contents: IndexableContent[]
): Promise<IndexingResult> {
  const errors: string[] = [];
  let indexed = 0;

  // Process in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (content) => {
        try {
          await indexContent(content);
          indexed++;
        } catch (error) {
          errors.push(
            `Failed to index ${content.id}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      })
    );
  }

  return {
    success: errors.length === 0,
    indexed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Index market data from database to search index
 */
export async function indexMarketData(
  tenantId?: string,
  limit: number = 100
): Promise<IndexingResult> {
  try {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const marketData = await prisma.marketData.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      take: limit,
    });

    const contents: IndexableContent[] = marketData.map((data) => {
      const dataObj = JSON.parse(data.data);
      return {
        id: `market_data_${data.id}`,
        content: JSON.stringify(dataObj),
        title: `${data.type} Market Data - ${data.date.toISOString()}`,
        type: "market_data",
        metadata: {
          date: data.date.toISOString(),
          source: data.source,
          assetClass: data.type,
          tenantId: data.tenantId || undefined,
        },
      };
    });

    return await batchIndexContent(contents);
  } catch (error) {
    throw new Error(
      `Failed to index market data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Index content sources (news, documents) to search index
 */
export async function indexContentSources(
  tenantId?: string,
  limit: number = 100
): Promise<IndexingResult> {
  try {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const sources = await prisma.contentSource.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      take: limit,
    });

    const contents: IndexableContent[] = [];

    for (const source of sources) {
      // For RSS/news sources, we might need to fetch the actual content
      // For now, we'll index the title and URL
      contents.push({
        id: `content_source_${source.id}`,
        content: source.title + (source.url ? `\n\nSource: ${source.url}` : ""),
        title: source.title,
        type: source.type,
        metadata: {
          date: source.date?.toISOString(),
          source: source.url || undefined,
          tenantId: source.tenantId || undefined,
          reliabilityScore: source.reliabilityScore || undefined,
        },
      });
    }

    return await batchIndexContent(contents);
  } catch (error) {
    throw new Error(
      `Failed to index content sources: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Index generated content (briefings, explainers, lessons) to search index
 */
export async function indexGeneratedContent(
  contentType: "briefing" | "explainer" | "lesson",
  tenantId?: string,
  limit: number = 100
): Promise<IndexingResult> {
  try {
    let contents: IndexableContent[] = [];

    if (contentType === "briefing") {
      const where: any = {};
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const briefings = await prisma.briefing.findMany({
        where,
        orderBy: {
          generatedAt: "desc",
        },
        take: limit,
      });

      contents = briefings.map((briefing) => {
        const contentObj = JSON.parse(briefing.content);
        return {
          id: `briefing_${briefing.id}`,
          content: typeof contentObj === "string" ? contentObj : JSON.stringify(contentObj),
          title: `Weekly ${briefing.type} Briefing`,
          type: "briefing",
          metadata: {
            date: briefing.generatedAt.toISOString(),
            tenantId: briefing.tenantId,
            weekStartDate: briefing.weekStartDate.toISOString(),
          },
        };
      });
    } else if (contentType === "explainer") {
      const where: any = {};
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const explainers = await prisma.explainer.findMany({
        where,
        orderBy: {
          generatedAt: "desc",
        },
        take: limit,
      });

      contents = explainers.map((explainer) => {
        const contentObj = JSON.parse(explainer.content);
        return {
          id: `explainer_${explainer.id}`,
          content: typeof contentObj === "string" ? contentObj : JSON.stringify(contentObj),
          title: explainer.topic,
          type: "explainer",
          metadata: {
            date: explainer.generatedAt.toISOString(),
            tenantId: explainer.tenantId,
            language: explainer.language,
          },
        };
      });
    } else if (contentType === "lesson") {
      const where: any = {};
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const lessons = await prisma.lesson.findMany({
        where,
        orderBy: {
          generatedAt: "desc",
        },
        take: limit,
      });

      contents = lessons.map((lesson) => {
        const contentObj = JSON.parse(lesson.content);
        return {
          id: `lesson_${lesson.id}`,
          content: typeof contentObj === "string" ? contentObj : JSON.stringify(contentObj),
          title: lesson.topic,
          type: "lesson",
          metadata: {
            date: lesson.generatedAt.toISOString(),
            tenantId: lesson.tenantId,
            language: lesson.language,
            generation: lesson.generation || undefined,
            sophisticationLevel: lesson.sophisticationLevel || undefined,
          },
        };
      });
    }

    return await batchIndexContent(contents);
  } catch (error) {
    throw new Error(
      `Failed to index ${contentType} content: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Remove content from search index
 */
export async function removeFromIndex(contentId: string): Promise<void> {
  const searchClient = getSearchClient();

  try {
    await searchClient.deleteDocuments([{ id: contentId }]);
  } catch (error) {
    throw new Error(
      `Failed to remove content from index: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}


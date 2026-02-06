import { generateText } from "../azure/openai";
import { searchVector, SearchResult } from "../azure/search";
import {
  getBriefingPrompt,
  getExplainerPrompt,
  getLessonPrompt,
  BriefingContext,
  ExplainerContext,
  LessonContext,
  SourceInfo,
} from "./prompts";
import {
  BriefingType,
  Generation,
  Language,
  SophisticationLevel,
} from "../types";
import {
  getLatestMarketData,
  formatMarketDataForPrompt,
} from "../ingestion/market-data";
import {
  formatSourcesForPrompt,
  extractCitations,
  storeCitations,
  updateBriefingCitations,
} from "../compliance/citations";

export interface GeneratedBriefing {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  keyTakeaways: string[];
  nextSteps: string[];
  sources?: Array<{
    title: string;
    date?: string;
    type: string;
  }>;
}

export interface GeneratedExplainer {
  title: string;
  summary: string;
  content: string;
  keyPoints: string[];
  relatedTopics: string[];
  sources?: Array<{
    title: string;
    type: string;
  }>;
}

export interface GeneratedLesson {
  title: string;
  content: string;
  keyTakeaways: string[];
  estimatedReadTime: string;
  sources?: Array<{
    title: string;
    type: string;
  }>;
}

/**
 * Extract source info from search results for prompt
 */
function extractSourceInfo(searchResults: SearchResult[]): SourceInfo[] {
  return searchResults.map((result) => {
    const metadata = result.metadata || {};
    return {
      title: metadata.Title || metadata.title || "Unknown Document",
      date: metadata.MeetingDate || metadata.date,
      type: metadata.Type || metadata.type || "document",
    };
  });
}

/**
 * Generate a weekly briefing (market or portfolio)
 * Integrates Azure Search (proprietary insights) and Alpha Vantage (market data)
 */
export async function generateBriefing(
  context: BriefingContext,
  options?: {
    briefingId?: string;
    tenantId?: string;
  }
): Promise<GeneratedBriefing> {
  const { briefingId, tenantId } = options || {};

  // Log portfolio data usage
  if (context.portfolioData) {
    console.log(
      `[Generators] Using portfolio data for ${context.type} briefing:`,
      {
        totalValue: context.portfolioData.totalValue,
        holdingsCount: context.portfolioData.holdings.length,
        topHoldings: context.portfolioData.holdings
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .map(
            (h) =>
              `${
                h.symbol || h.name
              }: $${h.value.toLocaleString()} (${h.percentage.toFixed(1)}%)`
          ),
        assetClasses: [
          ...new Set(
            context.portfolioData.holdings
              .map((h) => h.assetClass)
              .filter(Boolean)
          ),
        ],
      }
    );
  } else if (context.type === "portfolio") {
    console.log(
      `[Generators] Warning: Portfolio briefing requested but no portfolio data provided`
    );
  }

  // 1. Fetch current market data from Alpha Vantage (via database)
  let currentMarketData = context.currentMarketData || "";
  if (!currentMarketData) {
    try {
      const marketData = await getLatestMarketData(tenantId);
      if (marketData.length > 0) {
        currentMarketData = formatMarketDataForPrompt(marketData);
        console.log(`[Generators] Loaded ${marketData.length} market data points`);
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    }
  }

  // 2. Search Azure AI Search for proprietary insights
  let proprietaryInsights = context.proprietaryInsights || context.marketContext || "";
  let searchResults: SearchResult[] = [];
  let sources: SourceInfo[] = context.sources || [];

  if (!proprietaryInsights) {
    try {
      const searchQuery =
        context.type === "market"
          ? "weekly market trends economic conditions outlook"
          : "portfolio performance investment strategies allocation";

      // Calculate date range: from 4 weeks ago to now
      const now = new Date();
      const fourWeeksAgo = new Date(now);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      // Format dates in ISO 8601 format for Azure Search filter
      const startDate = fourWeeksAgo.toISOString();
      const endDate = now.toISOString();

      // Build filter string in Azure Search OData format
      const dateFilter = `MeetingDate gt '${startDate}' and MeetingDate lt '${endDate}'`;

      searchResults = await searchVector(searchQuery, {
        top: 5,
        filter: dateFilter,
        tenantId,
      });

      if (searchResults.length > 0) {
        // Format with source attribution
        proprietaryInsights = formatSourcesForPrompt(searchResults);
        sources = extractSourceInfo(searchResults);
        console.log(`[Generators] Found ${searchResults.length} proprietary sources`);
      }
    } catch (error) {
      console.error("Failed to search for proprietary insights:", error);
    }
  }

  // 3. Build the prompt with all context
  const prompt = getBriefingPrompt({
    ...context,
    proprietaryInsights,
    currentMarketData,
    sources,
  });

  // 4. Generate the briefing
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";
  const response = await generateText(deploymentName, prompt, {
    temperature: 0.7,
    maxTokens: 2500,
  });

  // 5. Parse the response
  let parsed: GeneratedBriefing;
  try {
    parsed = JSON.parse(response) as GeneratedBriefing;
  } catch (error) {
    // If JSON parsing fails, try to extract JSON from markdown code blocks
    const jsonMatch =
      response.match(/```json\n([\s\S]*?)\n```/) ||
      response.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]) as GeneratedBriefing;
    } else {
      // Fallback: create a structured response from plain text
      console.warn("[Generators] Failed to parse JSON response, using fallback");
      parsed = {
        title: `${
          context.type.charAt(0).toUpperCase() + context.type.slice(1)
        } Briefing`,
        summary: response.substring(0, 200),
        sections: [
          {
            heading: "Overview",
            content: response,
          },
        ],
        keyTakeaways: [],
        nextSteps: [],
        sources: sources.map((s) => ({
          title: s.title,
          date: s.date,
          type: s.type,
        })),
      };
    }
  }

  // 6. Extract and store citations if we have a briefingId
  if (briefingId && tenantId && searchResults.length > 0) {
    try {
      const fullContent = parsed.sections.map((s) => s.content).join("\n");
      const citations = await extractCitations(
        fullContent,
        searchResults,
        briefingId,
        "briefing",
        tenantId
      );

      if (citations.length > 0) {
        await storeCitations(citations);
        await updateBriefingCitations(briefingId, citations);
        console.log(`[Generators] Stored ${citations.length} citations for briefing`);
      }
    } catch (error) {
      console.error("Failed to store citations:", error);
    }
  }

  return parsed;
}

/**
 * Generate an explainer for a complex topic
 */
export async function generateExplainer(
  context: ExplainerContext
): Promise<GeneratedExplainer> {
  // Search for relevant context about the topic
  let searchContext = context.searchContext || "";
  let sources: SourceInfo[] = context.sources || [];

  if (!searchContext) {
    try {
      const searchResults = await searchVector(context.topic, { top: 5 });
      if (searchResults.length > 0) {
        searchContext = formatSourcesForPrompt(searchResults);
        sources = extractSourceInfo(searchResults);
      }
    } catch (error) {
      console.error("Failed to search for explainer context:", error);
    }
  }

  const prompt = getExplainerPrompt({
    ...context,
    searchContext,
    sources,
  });

  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";
  const response = await generateText(deploymentName, prompt, {
    temperature: 0.7,
    maxTokens: 1500,
  });

  try {
    const parsed = JSON.parse(response) as GeneratedExplainer;
    return parsed;
  } catch (error) {
    const jsonMatch =
      response.match(/```json\n([\s\S]*?)\n```/) ||
      response.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as GeneratedExplainer;
    }

    // Fallback
    return {
      title: context.topic,
      summary: response.substring(0, 150),
      content: response,
      keyPoints: [],
      relatedTopics: [],
      sources: sources.map((s) => ({ title: s.title, type: s.type })),
    };
  }
}

/**
 * Generate a micro-lesson
 */
export async function generateLesson(
  context: LessonContext
): Promise<GeneratedLesson> {
  // Search for relevant context if not provided
  let searchContext = context.searchContext || "";
  let sources: SourceInfo[] = context.sources || [];

  if (!searchContext) {
    try {
      const searchResults = await searchVector(context.topic, { top: 3 });
      if (searchResults.length > 0) {
        searchContext = formatSourcesForPrompt(searchResults);
        sources = extractSourceInfo(searchResults);
      }
    } catch (error) {
      console.error("Failed to search for lesson context:", error);
    }
  }

  const prompt = getLessonPrompt({
    ...context,
    searchContext,
    sources,
  });

  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";
  const response = await generateText(deploymentName, prompt, {
    temperature: 0.8,
    maxTokens: 800,
  });

  try {
    const parsed = JSON.parse(response) as GeneratedLesson;
    return parsed;
  } catch (error) {
    const jsonMatch =
      response.match(/```json\n([\s\S]*?)\n```/) ||
      response.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as GeneratedLesson;
    }

    // Fallback
    const wordCount = response.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    return {
      title: context.topic,
      content: response,
      keyTakeaways: [],
      estimatedReadTime: `${readTime} minute${readTime !== 1 ? "s" : ""}`,
      sources: sources.map((s) => ({ title: s.title, type: s.type })),
    };
  }
}

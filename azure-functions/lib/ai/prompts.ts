import {
  Generation,
  Language,
  SophisticationLevel,
  BriefingType,
} from "../types";

export interface SourceInfo {
  title: string;
  date?: string;
  type: string;
}

export interface BriefingContext {
  type: BriefingType;
  portfolioData?: {
    holdings: Array<{
      symbol?: string;
      name: string;
      value: number;
      percentage: number;
      assetClass?: string;
    }>;
    totalValue: number;
  };
  /** @deprecated Use proprietaryInsights instead */
  marketContext?: string;
  /** Proprietary insights from Azure Search (manager meetings, research docs) */
  proprietaryInsights?: string;
  /** List of sources used in proprietary insights */
  sources?: SourceInfo[];
  /** Current market data from Alpha Vantage */
  currentMarketData?: string;
  houseView?: string;
  userPreferences?: string[];
  generation?: Generation;
  language: Language;
  sophisticationLevel?: SophisticationLevel;
}

export interface ExplainerContext {
  topic: string;
  searchContext?: string;
  sources?: SourceInfo[];
  language: Language;
  sophisticationLevel?: SophisticationLevel;
}

export interface LessonContext {
  topic: string;
  generation?: Generation;
  language: Language;
  sophisticationLevel?: SophisticationLevel;
  searchContext?: string;
  sources?: SourceInfo[];
}

export function getBriefingPrompt(
  context: BriefingContext
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const {
    type,
    portfolioData,
    marketContext,
    proprietaryInsights,
    sources,
    currentMarketData,
    houseView,
    userPreferences,
    generation,
    language,
    sophisticationLevel,
  } = context;

  const languageNote =
    language !== "en" ? ` Respond in ${getLanguageName(language)}.` : "";
  const sophisticationNote = sophisticationLevel
    ? ` Adjust the complexity for a ${sophisticationLevel} investor.`
    : "";
  const generationNote = generation
    ? ` Tailor the tone and examples for ${generation} investors.`
    : "";

  // Build source list for citation instructions
  const sourceList = sources && sources.length > 0
    ? sources.map((s) => `"${s.title}"`).join(", ")
    : "the provided sources";

  let systemPrompt = `You are a wealth management advisor creating a personalized ${type} briefing for a high net worth client.${languageNote}${sophisticationNote}${generationNote}

IMPORTANT CITATION REQUIREMENTS:
- You MUST cite proprietary sources when referencing their insights using the format [Source: Document Title]
- Available sources to cite: ${sourceList}
- Every claim or insight from proprietary research must have a citation
- Current market data does not need citations (it's from public market feeds)

The briefing should be:
- Professional yet accessible
- Data-driven with clear insights from our proprietary research
- Grounded in current market conditions
- Actionable and relevant
- Compliant with financial regulations
- Approximately 500-800 words

Format the response as JSON with the following structure:
{
  "title": "Briefing title",
  "summary": "2-3 sentence executive summary",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content with inline [Source: Document Title] citations"
    }
  ],
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "nextSteps": ["actionable step 1", "actionable step 2"],
  "sources": [
    {
      "title": "Document Title",
      "date": "Month Year",
      "type": "manager_meeting or research"
    }
  ]
}`;

  let userPrompt = `Create a ${type} briefing for this week.`;

  // Add portfolio data for portfolio briefings
  if (type === "portfolio") {
    if (portfolioData) {
      const topHoldings = portfolioData.holdings
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10)
        .map((h) => `${h.name} (${h.percentage.toFixed(1)}%)`)
        .join(", ");

      userPrompt += `\n\nPortfolio Overview:
- Total Value: $${portfolioData.totalValue.toLocaleString()}
- Top Holdings: ${topHoldings}
- Asset Classes: ${[
        ...new Set(
          portfolioData.holdings.map((h) => h.assetClass).filter(Boolean)
        ),
      ].join(", ")}`;
    } else {
      userPrompt += "\n\nNote: Portfolio data is not available for this user.";
    }
  }

  // Add current market data section (from Alpha Vantage)
  if (currentMarketData) {
    userPrompt += `\n\n${currentMarketData}`;
  }

  // Add proprietary insights section (from Azure Search)
  // Use new field if available, fall back to old marketContext for backwards compatibility
  const insights = proprietaryInsights || marketContext;
  if (insights) {
    userPrompt += `\n\n${insights}`;
  }

  // Add house view if available
  if (houseView) {
    userPrompt += `\n\n${houseView}`;
  }

  // Add user preferences
  if (userPreferences && userPreferences.length > 0) {
    userPrompt += `\n\nUser is particularly interested in: ${userPreferences.join(
      ", "
    )}`;
  }

  // Remind about citations
  userPrompt += `\n\nRemember to cite sources using [Source: Document Title] format when referencing proprietary insights.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function getExplainerPrompt(
  context: ExplainerContext
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const { topic, searchContext, sources, language, sophisticationLevel } = context;

  const languageNote =
    language !== "en" ? ` Respond in ${getLanguageName(language)}.` : "";
  const sophisticationNote = sophisticationLevel
    ? ` Adjust the complexity for a ${sophisticationLevel} investor.`
    : "";

  const sourceList = sources && sources.length > 0
    ? sources.map((s) => `"${s.title}"`).join(", ")
    : "the provided sources";

  const systemPrompt = `You are a financial education expert explaining complex wealth management topics to high net worth clients.${languageNote}${sophisticationNote}

CITATION REQUIREMENTS:
- Cite sources using [Source: Document Title] format when referencing specific insights
- Available sources: ${sourceList}

Your explanations should be:
- Clear and concise (300-500 words)
- Accurate and compliant with financial regulations
- Use real-world examples when helpful
- Avoid jargon or explain it clearly
- Structured with clear headings

Format the response as JSON:
{
  "title": "Topic title",
  "summary": "1-2 sentence summary",
  "content": "Main explanation content with markdown formatting and [Source: Title] citations",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "relatedTopics": ["related topic 1", "related topic 2"],
  "sources": [{"title": "Document Title", "type": "document"}]
}`;

  const userPrompt = `Explain "${topic}" in detail.

${searchContext ? `Context from knowledge base:\n${searchContext}\n\n` : ""}
Provide a comprehensive explanation that helps a high net worth investor understand this topic. Remember to cite sources.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function getLessonPrompt(
  context: LessonContext
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const { topic, generation, language, sophisticationLevel, searchContext, sources } =
    context;

  const languageNote =
    language !== "en" ? ` Respond in ${getLanguageName(language)}.` : "";
  const sophisticationNote = sophisticationLevel
    ? ` Adjust for a ${sophisticationLevel} level.`
    : "";
  const generationNote = generation
    ? ` Make it engaging and relevant for ${generation} investors.`
    : "";

  const sourceList = sources && sources.length > 0
    ? sources.map((s) => `"${s.title}"`).join(", ")
    : "the provided context";

  const systemPrompt = `You are creating a micro-lesson (short educational content) for wealth management clients.${languageNote}${sophisticationNote}${generationNote}

If citing sources, use [Source: Document Title] format.
Available sources: ${sourceList}

The lesson should be:
- Brief (150-300 words)
- Engaging and easy to understand
- Include practical examples
- Actionable takeaways
- Suitable for quick reading

Format the response as JSON:
{
  "title": "Lesson title",
  "content": "Lesson content with markdown formatting",
  "keyTakeaways": ["takeaway 1", "takeaway 2"],
  "estimatedReadTime": "X minutes",
  "sources": [{"title": "Document Title", "type": "document"}]
}`;

  const userPrompt = `Create a micro-lesson about "${topic}".

${searchContext ? `Context:\n${searchContext}\n\n` : ""}
Make it concise, engaging, and practical.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

function getLanguageName(language: Language): string {
  const names: Record<Language, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    zh: "Chinese",
    ja: "Japanese",
  };
  return names[language] || "English";
}

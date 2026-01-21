import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

let searchClient: SearchClient<Record<string, any>> | null = null;

export function getSearchClient(): SearchClient<Record<string, any>> {
  if (!searchClient) {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;
    const indexName = process.env.AZURE_SEARCH_INDEX_NAME;

    if (!endpoint || !apiKey || !indexName) {
      throw new Error("Azure AI Search credentials are not configured");
    }

    searchClient = new SearchClient<Record<string, any>>(
      endpoint,
      indexName,
      new AzureKeyCredential(apiKey),
    );
  }

  return searchClient;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export async function searchVector(
  query: string,
  options?: {
    top?: number;
    filter?: string;
    tenantId?: string;
  },
): Promise<SearchResult[]> {
  const client = getSearchClient();

  // Add tenant filter if provided
  let filter = options?.filter || "";
  if (options?.tenantId) {
    const tenantFilter = `tenantId eq '${options.tenantId}'`;
    filter = filter ? `${filter} and ${tenantFilter}` : tenantFilter;
  }

  const searchResults = await client.search(query, {
    top: options?.top ?? 5,
    filter: filter || undefined,
    includeTotalCount: true,
  });

  const results: SearchResult[] = [];
  for await (const result of searchResults.results) {
    results.push({
      content: result.document.content || "",
      score: result.score || 0,
      metadata: {
        title: result.document.title,
        type: result.document.type,
        date: result.document.date,
        source: result.document.source,
      },
    });
  }

  return results;
}

export async function searchKeyword(
  query: string,
  options?: {
    top?: number;
    filter?: string;
  },
): Promise<SearchResult[]> {
  const client = getSearchClient();

  const searchResults = await client.search(query, {
    searchMode: "all",
    queryType: "simple",
    top: options?.top ?? 5,
    filter: options?.filter,
    includeTotalCount: true,
  });

  const results: SearchResult[] = [];
  for await (const result of searchResults.results) {
    results.push({
      content: result.document.content || "",
      score: result.score || 0,
      metadata: {
        title: result.document.title,
        type: result.document.type,
        date: result.document.date,
        source: result.document.source,
      },
    });
  }

  return results;
}

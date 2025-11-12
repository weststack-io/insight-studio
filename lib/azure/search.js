"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchClient = getSearchClient;
exports.searchVector = searchVector;
exports.hybridSearch = hybridSearch;
const search_documents_1 = require("@azure/search-documents");
let searchClient = null;
function getSearchClient() {
    if (!searchClient) {
        const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
        const apiKey = process.env.AZURE_SEARCH_API_KEY;
        const indexName = process.env.AZURE_SEARCH_INDEX_NAME;
        if (!endpoint || !apiKey || !indexName) {
            throw new Error('Azure AI Search credentials are not configured');
        }
        searchClient = new search_documents_1.SearchClient(endpoint, indexName, new search_documents_1.AzureKeyCredential(apiKey));
    }
    return searchClient;
}
async function searchVector(query, options) {
    const client = getSearchClient();
    const searchResults = await client.search(query, {
        top: options?.top ?? 5,
        filter: options?.filter,
        includeTotalCount: true,
    });
    const results = [];
    for await (const result of searchResults.results) {
        results.push({
            content: result.document.content || JSON.stringify(result.document),
            score: result.score || 0,
            metadata: result.document,
        });
    }
    return results;
}
async function hybridSearch(query, vectorQuery, options) {
    const client = getSearchClient();
    const searchOptions = {
        top: options?.top ?? 5,
        filter: options?.filter,
        includeTotalCount: true,
    };
    if (vectorQuery) {
        searchOptions.vectorQueries = [{
                kind: 'vector',
                vector: vectorQuery.vector,
                kNearestNeighborsCount: vectorQuery.kNearestNeighborsCount ?? 5,
            }];
    }
    const searchResults = await client.search(query, searchOptions);
    const results = [];
    for await (const result of searchResults.results) {
        results.push({
            content: result.document.content || JSON.stringify(result.document),
            score: result.score || 0,
            metadata: result.document,
        });
    }
    return results;
}
//# sourceMappingURL=search.js.map
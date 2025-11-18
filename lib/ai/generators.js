"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLesson = exports.generateExplainer = exports.generateBriefing = void 0;
const openai_1 = require("@/lib/azure/openai");
const search_1 = require("@/lib/azure/search");
const prompts_1 = require("./prompts");
/**
 * Generate a weekly briefing (market or portfolio)
 */
function generateBriefing(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Log portfolio data usage
        if (context.portfolioData) {
            console.log(`[Generators] Using portfolio data for ${context.type} briefing:`, {
                totalValue: context.portfolioData.totalValue,
                holdingsCount: context.portfolioData.holdings.length,
                topHoldings: context.portfolioData.holdings
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)
                    .map(h => `${h.symbol || h.name}: $${h.value.toLocaleString()} (${h.percentage.toFixed(1)}%)`),
                assetClasses: [...new Set(context.portfolioData.holdings.map(h => h.assetClass).filter(Boolean))],
            });
        }
        else if (context.type === "portfolio") {
            console.log(`[Generators] Warning: Portfolio briefing requested but no portfolio data provided`);
        }
        // Search for relevant market context if needed
        let marketContext = "";
        if (context.type === "market" || !context.marketContext) {
            try {
                const searchQuery = context.type === "market"
                    ? "weekly market trends economic conditions"
                    : "portfolio performance investment strategies";
                // Calculate date range: from 2 weeks ago to now (covering most recent week or couple of weeks)
                const now = new Date();
                const twoWeeksAgo = new Date(now);
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                // Format dates in ISO 8601 format for Azure Search filter
                const startDate = twoWeeksAgo.toISOString();
                const endDate = now.toISOString();
                // Build filter string in Azure Search OData format
                const dateFilter = `MeetingDate gt '${startDate}' and MeetingDate lt '${endDate}'`;
                const searchResults = yield (0, search_1.searchVector)(searchQuery, {
                    top: 3,
                    filter: dateFilter,
                });
                marketContext = searchResults.map((r) => r.content).join("\n\n");
            }
            catch (error) {
                console.error("Failed to search for market context:", error);
            }
        }
        else {
            marketContext = context.marketContext;
        }
        const prompt = (0, prompts_1.getBriefingPrompt)(Object.assign(Object.assign({}, context), { marketContext }));
        const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";
        const response = yield (0, openai_1.generateText)(deploymentName, prompt, {
            temperature: 0.7,
            maxTokens: 2000,
        });
        try {
            const parsed = JSON.parse(response);
            return parsed;
        }
        catch (error) {
            // If JSON parsing fails, try to extract JSON from markdown code blocks
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                response.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            // Fallback: create a structured response from plain text
            return {
                title: `${context.type.charAt(0).toUpperCase() + context.type.slice(1)} Briefing`,
                summary: response.substring(0, 200),
                sections: [
                    {
                        heading: "Overview",
                        content: response,
                    },
                ],
                keyTakeaways: [],
                nextSteps: [],
            };
        }
    });
}
exports.generateBriefing = generateBriefing;
/**
 * Generate an explainer for a complex topic
 */
function generateExplainer(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Search for relevant context about the topic
        let searchContext = "";
        try {
            const searchResults = yield (0, search_1.searchVector)(context.topic, { top: 5 });
            searchContext = searchResults.map((r) => r.content).join("\n\n");
        }
        catch (error) {
            console.error("Failed to search for explainer context:", error);
        }
        const prompt = (0, prompts_1.getExplainerPrompt)(Object.assign(Object.assign({}, context), { searchContext: searchContext || context.searchContext }));
        const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";
        const response = yield (0, openai_1.generateText)(deploymentName, prompt, {
            temperature: 0.7,
            maxTokens: 1500,
        });
        try {
            const parsed = JSON.parse(response);
            return parsed;
        }
        catch (error) {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                response.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            // Fallback
            return {
                title: context.topic,
                summary: response.substring(0, 150),
                content: response,
                keyPoints: [],
                relatedTopics: [],
            };
        }
    });
}
exports.generateExplainer = generateExplainer;
/**
 * Generate a micro-lesson
 */
function generateLesson(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Search for relevant context if not provided
        let searchContext = context.searchContext || "";
        if (!searchContext) {
            try {
                const searchResults = yield (0, search_1.searchVector)(context.topic, { top: 3 });
                searchContext = searchResults.map((r) => r.content).join("\n\n");
            }
            catch (error) {
                console.error("Failed to search for lesson context:", error);
            }
        }
        const prompt = (0, prompts_1.getLessonPrompt)(Object.assign(Object.assign({}, context), { searchContext }));
        const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";
        const response = yield (0, openai_1.generateText)(deploymentName, prompt, {
            temperature: 0.8,
            maxTokens: 800,
        });
        try {
            const parsed = JSON.parse(response);
            return parsed;
        }
        catch (error) {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                response.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            // Fallback
            const wordCount = response.split(/\s+/).length;
            const readTime = Math.ceil(wordCount / 200);
            return {
                title: context.topic,
                content: response,
                keyTakeaways: [],
                estimatedReadTime: `${readTime} minute${readTime !== 1 ? "s" : ""}`,
            };
        }
    });
}
exports.generateLesson = generateLesson;
//# sourceMappingURL=generators.js.map
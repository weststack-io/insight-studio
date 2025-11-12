"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBriefing = generateBriefing;
exports.generateExplainer = generateExplainer;
exports.generateLesson = generateLesson;
const openai_1 = require("@/lib/azure/openai");
const search_1 = require("@/lib/azure/search");
const prompts_1 = require("./prompts");
/**
 * Generate a weekly briefing (market or portfolio)
 */
async function generateBriefing(context) {
    // Search for relevant market context if needed
    let marketContext = '';
    if (context.type === 'market' || !context.marketContext) {
        try {
            const searchQuery = context.type === 'market'
                ? 'weekly market trends economic conditions'
                : 'portfolio performance investment strategies';
            const searchResults = await (0, search_1.searchVector)(searchQuery, { top: 3 });
            marketContext = searchResults
                .map(r => r.content)
                .join('\n\n');
        }
        catch (error) {
            console.error('Failed to search for market context:', error);
        }
    }
    else {
        marketContext = context.marketContext;
    }
    const prompt = (0, prompts_1.getBriefingPrompt)({
        ...context,
        marketContext,
    });
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
    const response = await (0, openai_1.generateText)(deploymentName, prompt, {
        temperature: 0.7,
        maxTokens: 2000,
    });
    try {
        const parsed = JSON.parse(response);
        return parsed;
    }
    catch (error) {
        // If JSON parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        // Fallback: create a structured response from plain text
        return {
            title: `${context.type.charAt(0).toUpperCase() + context.type.slice(1)} Briefing`,
            summary: response.substring(0, 200),
            sections: [
                {
                    heading: 'Overview',
                    content: response,
                },
            ],
            keyTakeaways: [],
            nextSteps: [],
        };
    }
}
/**
 * Generate an explainer for a complex topic
 */
async function generateExplainer(context) {
    // Search for relevant context about the topic
    let searchContext = '';
    try {
        const searchResults = await (0, search_1.searchVector)(context.topic, { top: 5 });
        searchContext = searchResults
            .map(r => r.content)
            .join('\n\n');
    }
    catch (error) {
        console.error('Failed to search for explainer context:', error);
    }
    const prompt = (0, prompts_1.getExplainerPrompt)({
        ...context,
        searchContext: searchContext || context.searchContext,
    });
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
    const response = await (0, openai_1.generateText)(deploymentName, prompt, {
        temperature: 0.7,
        maxTokens: 1500,
    });
    try {
        const parsed = JSON.parse(response);
        return parsed;
    }
    catch (error) {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
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
}
/**
 * Generate a micro-lesson
 */
async function generateLesson(context) {
    // Search for relevant context if not provided
    let searchContext = context.searchContext || '';
    if (!searchContext) {
        try {
            const searchResults = await (0, search_1.searchVector)(context.topic, { top: 3 });
            searchContext = searchResults
                .map(r => r.content)
                .join('\n\n');
        }
        catch (error) {
            console.error('Failed to search for lesson context:', error);
        }
    }
    const prompt = (0, prompts_1.getLessonPrompt)({
        ...context,
        searchContext,
    });
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
    const response = await (0, openai_1.generateText)(deploymentName, prompt, {
        temperature: 0.8,
        maxTokens: 800,
    });
    try {
        const parsed = JSON.parse(response);
        return parsed;
    }
    catch (error) {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
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
            estimatedReadTime: `${readTime} minute${readTime !== 1 ? 's' : ''}`,
        };
    }
}
//# sourceMappingURL=generators.js.map
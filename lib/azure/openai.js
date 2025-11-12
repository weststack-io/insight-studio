"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAIClient = getOpenAIClient;
exports.generateText = generateText;
const openai_1 = require("openai");
let openAIClient = null;
function getOpenAIClient() {
    if (!openAIClient) {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
        if (!endpoint || !apiKey) {
            throw new Error("Azure OpenAI credentials are not configured");
        }
        openAIClient = new openai_1.AzureOpenAI({
            endpoint,
            apiKey,
            apiVersion,
        });
    }
    return openAIClient;
}
async function generateText(deploymentName, messages, options) {
    const client = getOpenAIClient();
    const deployment = deploymentName || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4";
    const response = await client.chat.completions.create({
        model: deployment,
        messages: messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error("No content generated from OpenAI");
    }
    return content;
}
//# sourceMappingURL=openai.js.map
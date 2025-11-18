"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const client_1 = require("@prisma/client");
const generators_1 = require("../../lib/ai/generators");
const client_2 = require("../../lib/addepar/client");
const prisma = new client_1.PrismaClient();
/**
 * Azure Function to generate weekly briefings for all active users
 * Runs on a timer trigger (e.g., every Monday at 9 AM)
 */
async function weeklyBriefingsGenerator(myTimer, context) {
    context.log("Starting weekly briefings generation");
    try {
        // Get all active users
        const users = await prisma.user.findMany({
            include: {
                userPreferences: true,
                tenant: true,
            },
        });
        context.log(`Found ${users.length} users to process`);
        // Calculate week start date (Monday of current week)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStartDate = new Date(now.setDate(diff));
        weekStartDate.setHours(0, 0, 0, 0);
        // Check if briefings already exist for this week
        const existingBriefings = await prisma.briefing.findMany({
            where: {
                weekStartDate,
            },
            select: {
                userId: true,
                type: true,
            },
        });
        const existingKeys = new Set(existingBriefings.map((b) => `${b.userId}-${b.type}`));
        const addeparClient = (0, client_2.getAddeparClient)();
        let successCount = 0;
        let errorCount = 0;
        // Process users in batches to avoid overwhelming the API
        const batchSize = 10;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.all(batch.map(async (user) => {
                try {
                    // Generate market briefing
                    if (user.tenantId) {
                        const marketKey = `${user.id}-market`;
                        if (!existingKeys.has(marketKey)) {
                            const marketBriefing = await (0, generators_1.generateBriefing)({
                                type: "market",
                                language: user.language,
                                generation: user.generation,
                                sophisticationLevel: user.sophisticationLevel,
                                userPreferences: user.userPreferences.map((p) => p.topic),
                            });
                            await prisma.briefing.create({
                                data: {
                                    userId: user.id,
                                    tenantId: user.tenantId,
                                    type: "market",
                                    content: JSON.stringify(marketBriefing),
                                    weekStartDate,
                                },
                            });
                            context.log(`Generated market briefing for user ${user.id}`);
                        }
                    }
                    // Generate portfolio briefing if user has Addepar entity ID
                    if (user.tenantId) {
                        const portfolioKey = `${user.id}-portfolio`;
                        if (!existingKeys.has(portfolioKey)) {
                            // Parse preferences JSON to get addeparEntityId
                            let addeparEntityId;
                            if (user.preferences) {
                                try {
                                    const preferences = JSON.parse(user.preferences);
                                    addeparEntityId = preferences.addeparEntityId;
                                }
                                catch (e) {
                                    // If parsing fails, preferences might be invalid JSON
                                    context.log(`Warning: Failed to parse preferences for user ${user.id}:`, e);
                                }
                            }
                            if (addeparEntityId) {
                                try {
                                    context.log(`Fetching portfolio data for user ${user.id} with entity ID: ${addeparEntityId}`);
                                    const portfolioData = await addeparClient.getPortfolioData(addeparEntityId);
                                    context.log(`Successfully retrieved portfolio data for user ${user.id}:`, {
                                        totalValue: portfolioData.totalValue,
                                        holdingsCount: portfolioData.holdings.length,
                                    });
                                    context.log(`Generating portfolio briefing for user ${user.id} with portfolio data`);
                                    const portfolioBriefing = await (0, generators_1.generateBriefing)({
                                        type: "portfolio",
                                        portfolioData,
                                        language: user.language,
                                        generation: user.generation,
                                        sophisticationLevel: user.sophisticationLevel,
                                        userPreferences: user.userPreferences.map((p) => p.topic),
                                    });
                                    await prisma.briefing.create({
                                        data: {
                                            userId: user.id,
                                            tenantId: user.tenantId,
                                            type: "portfolio",
                                            content: JSON.stringify(portfolioBriefing),
                                            weekStartDate,
                                        },
                                    });
                                    context.log(`Generated portfolio briefing for user ${user.id}`);
                                }
                                catch (error) {
                                    context.log(`Warning: Failed to generate portfolio briefing for user ${user.id}:`, error);
                                }
                            }
                        }
                    }
                    successCount++;
                }
                catch (error) {
                    context.log(`Error: Failed to process user ${user.id}:`, error);
                    errorCount++;
                }
            }));
        }
        context.log(`Weekly briefings generation completed. Success: ${successCount}, Errors: ${errorCount}`);
    }
    catch (error) {
        context.log("Error: Failed to generate weekly briefings:", error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
functions_1.app.timer("weeklyBriefingsGenerator", {
    schedule: "0 0 9 * * 1", // Every Monday at 9 AM
    handler: weeklyBriefingsGenerator,
});
//# sourceMappingURL=index.js.map
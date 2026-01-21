"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertHouseView = upsertHouseView;
exports.getActiveHouseView = getActiveHouseView;
exports.getAllHouseViews = getAllHouseViews;
exports.getHouseViewById = getHouseViewById;
exports.deactivateHouseView = deactivateHouseView;
exports.formatHouseViewForPrompt = formatHouseViewForPrompt;
const client_1 = require("@prisma/client");
const adapter_1 = require("@/lib/db/adapter");
const prisma = new client_1.PrismaClient({
    adapter: (0, adapter_1.createMssqlAdapter)(),
});
/**
 * Create or update a house view
 */
async function upsertHouseView(input) {
    try {
        // Check if an active house view exists for this tenant
        const existing = await prisma.houseView.findFirst({
            where: {
                tenantId: input.tenantId,
                isActive: true,
            },
        });
        if (existing) {
            // Create a new version
            const newVersion = existing.version + 1;
            // Deactivate the old version
            await prisma.houseView.update({
                where: { id: existing.id },
                data: { isActive: false },
            });
            // Create new version
            const houseView = await prisma.houseView.create({
                data: {
                    tenantId: input.tenantId,
                    title: input.title,
                    content: input.content,
                    version: newVersion,
                    isActive: input.isActive !== false,
                },
            });
            return houseView;
        }
        else {
            // Create first version
            const houseView = await prisma.houseView.create({
                data: {
                    tenantId: input.tenantId,
                    title: input.title,
                    content: input.content,
                    version: 1,
                    isActive: input.isActive !== false,
                },
            });
            return houseView;
        }
    }
    catch (error) {
        throw new Error(`Failed to upsert house view: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get active house view for a tenant
 */
async function getActiveHouseView(tenantId) {
    try {
        const houseView = await prisma.houseView.findFirst({
            where: {
                tenantId,
                isActive: true,
            },
        });
        return houseView;
    }
    catch (error) {
        throw new Error(`Failed to get active house view: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get all house views for a tenant (including inactive)
 */
async function getAllHouseViews(tenantId) {
    try {
        const houseViews = await prisma.houseView.findMany({
            where: {
                tenantId,
            },
            orderBy: {
                version: "desc",
            },
        });
        return houseViews;
    }
    catch (error) {
        throw new Error(`Failed to get house views: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Get house view by ID
 */
async function getHouseViewById(id) {
    try {
        const houseView = await prisma.houseView.findUnique({
            where: { id },
        });
        return houseView;
    }
    catch (error) {
        throw new Error(`Failed to get house view: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Deactivate a house view
 */
async function deactivateHouseView(id) {
    try {
        await prisma.houseView.update({
            where: { id },
            data: { isActive: false },
        });
    }
    catch (error) {
        throw new Error(`Failed to deactivate house view: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Format house view for inclusion in RAG prompts
 */
function formatHouseViewForPrompt(houseView) {
    if (!houseView) {
        return "";
    }
    return `\n\n## House View (${houseView.title})\n\n${houseView.content}\n\n`;
}
//# sourceMappingURL=house-views.js.map
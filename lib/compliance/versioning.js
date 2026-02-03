"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContentVersion = createContentVersion;
exports.getCurrentVersion = getCurrentVersion;
exports.getContentVersion = getContentVersion;
exports.getAllVersions = getAllVersions;
const client_1 = require("@/lib/db/client");
/**
 * Create a new version of content
 */
async function createContentVersion(contentId, contentType, content, status = "draft") {
    // Get current version number
    const currentVersion = await getCurrentVersion(contentId, contentType);
    const newVersion = currentVersion + 1;
    await client_1.prisma.contentVersion.create({
        data: {
            contentId,
            contentType,
            version: newVersion,
            content,
            status,
        },
    });
    // Update version number on content
    await updateContentVersion(contentId, contentType, newVersion);
}
/**
 * Get current version number for content
 */
async function getCurrentVersion(contentId, contentType) {
    if (contentType === "briefing") {
        const briefing = await client_1.prisma.briefing.findUnique({
            where: { id: contentId },
            select: { version: true },
        });
        return briefing?.version || 1;
    }
    else if (contentType === "explainer") {
        // Explainers don't have version field, check ContentVersion table
        const latestVersion = await client_1.prisma.contentVersion.findFirst({
            where: {
                contentId,
                contentType,
            },
            orderBy: {
                version: "desc",
            },
            select: {
                version: true,
            },
        });
        return latestVersion?.version || 1;
    }
    else if (contentType === "lesson") {
        // Lessons don't have version field, check ContentVersion table
        const latestVersion = await client_1.prisma.contentVersion.findFirst({
            where: {
                contentId,
                contentType,
            },
            orderBy: {
                version: "desc",
            },
            select: {
                version: true,
            },
        });
        return latestVersion?.version || 1;
    }
    return 1;
}
/**
 * Update version number on content
 */
async function updateContentVersion(contentId, contentType, version) {
    if (contentType === "briefing") {
        await client_1.prisma.briefing.update({
            where: { id: contentId },
            data: { version },
        });
    }
    // Explainers and lessons don't have version field in their models
}
/**
 * Get content version by version number
 */
async function getContentVersion(contentId, contentType, version) {
    return await client_1.prisma.contentVersion.findUnique({
        where: {
            contentId_contentType_version: {
                contentId,
                contentType,
                version,
            },
        },
    });
}
/**
 * Get all versions for content
 */
async function getAllVersions(contentId, contentType) {
    return await client_1.prisma.contentVersion.findMany({
        where: {
            contentId,
            contentType,
        },
        orderBy: {
            version: "desc",
        },
    });
}
//# sourceMappingURL=versioning.js.map
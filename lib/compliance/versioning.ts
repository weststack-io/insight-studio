import { prisma } from "@/lib/db/client";

type ContentType = "briefing" | "explainer" | "lesson";

/**
 * Create a new version of content
 */
export async function createContentVersion(
  contentId: string,
  contentType: ContentType,
  content: string,
  status: string = "draft"
): Promise<void> {
  // Get current version number
  const currentVersion = await getCurrentVersion(contentId, contentType);
  const newVersion = currentVersion + 1;

  await prisma.contentVersion.create({
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
export async function getCurrentVersion(
  contentId: string,
  contentType: ContentType
): Promise<number> {
  if (contentType === "briefing") {
    const briefing = await prisma.briefing.findUnique({
      where: { id: contentId },
      select: { version: true },
    });
    return briefing?.version || 1;
  } else if (contentType === "explainer") {
    // Explainers don't have version field, check ContentVersion table
    const latestVersion = await prisma.contentVersion.findFirst({
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
  } else if (contentType === "lesson") {
    // Lessons don't have version field, check ContentVersion table
    const latestVersion = await prisma.contentVersion.findFirst({
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
async function updateContentVersion(
  contentId: string,
  contentType: ContentType,
  version: number
): Promise<void> {
  if (contentType === "briefing") {
    await prisma.briefing.update({
      where: { id: contentId },
      data: { version },
    });
  }
  // Explainers and lessons don't have version field in their models
}

/**
 * Get content version by version number
 */
export async function getContentVersion(
  contentId: string,
  contentType: ContentType,
  version: number
) {
  return await prisma.contentVersion.findUnique({
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
export async function getAllVersions(
  contentId: string,
  contentType: ContentType
) {
  return await prisma.contentVersion.findMany({
    where: {
      contentId,
      contentType,
    },
    orderBy: {
      version: "desc",
    },
  });
}


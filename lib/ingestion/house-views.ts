import { PrismaClient } from "@prisma/client";
import { createMssqlAdapter } from "@/lib/db/adapter";

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});

export interface HouseViewInput {
  tenantId: string;
  title: string;
  content: string;
  isActive?: boolean;
}

export interface HouseView {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create or update a house view
 */
export async function upsertHouseView(
  input: HouseViewInput
): Promise<HouseView> {
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
    } else {
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
  } catch (error) {
    throw new Error(
      `Failed to upsert house view: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get active house view for a tenant
 */
export async function getActiveHouseView(
  tenantId: string
): Promise<HouseView | null> {
  try {
    const houseView = await prisma.houseView.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
    });

    return houseView;
  } catch (error) {
    throw new Error(
      `Failed to get active house view: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get all house views for a tenant (including inactive)
 */
export async function getAllHouseViews(
  tenantId: string
): Promise<HouseView[]> {
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
  } catch (error) {
    throw new Error(
      `Failed to get house views: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get house view by ID
 */
export async function getHouseViewById(id: string): Promise<HouseView | null> {
  try {
    const houseView = await prisma.houseView.findUnique({
      where: { id },
    });

    return houseView;
  } catch (error) {
    throw new Error(
      `Failed to get house view: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Deactivate a house view
 */
export async function deactivateHouseView(id: string): Promise<void> {
  try {
    await prisma.houseView.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    throw new Error(
      `Failed to deactivate house view: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Format house view for inclusion in RAG prompts
 */
export function formatHouseViewForPrompt(houseView: HouseView | null): string {
  if (!houseView) {
    return "";
  }

  return `\n\n## House View (${houseView.title})\n\n${houseView.content}\n\n`;
}


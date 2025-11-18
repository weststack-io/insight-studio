import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { generateBriefing } from "@/lib/ai/generators";
import { getAddeparClient } from "@/lib/addepar/client";
import { BriefingType } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as BriefingType | null;
    const weekStart = searchParams.get("weekStart");

    const where: any = {
      userId,
    };

    if (type) {
      where.type = type;
    }

    if (weekStart) {
      where.weekStartDate = new Date(weekStart);
    }

    const briefings = await prisma.briefing.findMany({
      where,
      orderBy: {
        weekStartDate: "desc",
      },
      take: 10,
    });

    return NextResponse.json({ briefings });
  } catch (error) {
    console.error("Failed to fetch briefings:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const tenantId = user.tenantId;
    const body = await request.json();
    const { type } = body as { type: BriefingType };

    // Get user preferences
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPreferences: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get portfolio data if portfolio briefing
    let portfolioData;
    if (type === "portfolio") {
      try {
        // Parse preferences JSON to get addeparEntityId
        let addeparEntityId: string | undefined;
        if (dbUser.preferences) {
          try {
            const preferences = JSON.parse(dbUser.preferences);
            addeparEntityId = preferences.addeparEntityId;
          } catch (e) {
            // If parsing fails, preferences might be invalid JSON
            console.error("Failed to parse user preferences:", e);
          }
        }

        if (addeparEntityId) {
          console.log(
            `[Briefings] Fetching portfolio data for entity ID: ${addeparEntityId}`
          );
          const addeparClient = getAddeparClient();
          portfolioData = await addeparClient.getPortfolioData(addeparEntityId);
          console.log(`[Briefings] Successfully retrieved portfolio data:`, {
            totalValue: portfolioData?.totalValue,
            holdingsCount: portfolioData?.holdings.length,
            hasData: !!portfolioData,
          });
        } else {
          console.log(
            `[Briefings] No Addepar Entity ID found in user preferences for portfolio briefing`
          );
        }
      } catch (error) {
        console.error("[Briefings] Failed to fetch portfolio data:", error);
      }
    }

    // Generate briefing
    console.log(
      `[Briefings] Generating ${type} briefing with portfolio data:`,
      {
        hasPortfolioData: !!portfolioData,
        portfolioValue: portfolioData?.totalValue,
        holdingsCount: portfolioData?.holdings?.length,
      }
    );
    const briefingContent = await generateBriefing({
      type,
      portfolioData,
      language: dbUser.language as any,
      generation: dbUser.generation as any,
      sophisticationLevel: dbUser.sophisticationLevel as any,
      userPreferences: dbUser.userPreferences.map((p) => p.topic),
    });

    console.log(`[Briefings] Successfully generated ${type} briefing:`, {
      title: briefingContent.title,
      sectionsCount: briefingContent.sections.length,
      keyTakeawaysCount: briefingContent.keyTakeaways.length,
      usedPortfolioData: !!portfolioData,
    });

    // Calculate week start date (Monday of current week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const weekStartDate = new Date(now.setDate(diff));
    weekStartDate.setHours(0, 0, 0, 0);

    // Save briefing
    const briefing = await prisma.briefing.create({
      data: {
        userId,
        tenantId,
        type,
        content: JSON.stringify(briefingContent),
        weekStartDate,
      },
    });

    return NextResponse.json({ briefing });
  } catch (error) {
    console.error("Failed to generate briefing:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const searchParams = request.nextUrl.searchParams;
    const briefingId = searchParams.get("id");

    if (!briefingId) {
      return NextResponse.json(
        { error: "Briefing ID is required" },
        { status: 400 }
      );
    }

    // Verify the briefing belongs to the user
    const briefing = await prisma.briefing.findUnique({
      where: { id: briefingId },
    });

    if (!briefing) {
      return NextResponse.json(
        { error: "Briefing not found" },
        { status: 404 }
      );
    }

    if (briefing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the briefing
    await prisma.briefing.delete({
      where: { id: briefingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete briefing:", error);
    return NextResponse.json(
      { error: "Failed to delete briefing" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { generateBriefing } from "@/lib/ai/generators";
// import { getAddeparClient } from "@/lib/addepar/client";
import { BriefingType } from "@/types";
import { searchVector, SearchResult } from "@/lib/azure/search";
import {
  extractCitations,
  storeCitations,
  updateContentCitations,
} from "@/lib/compliance/citations";
import { calculateMultiFactorRiskScore } from "@/lib/compliance/risk-scoring";
import { logContentGeneration } from "@/lib/compliance/audit";
import type { BriefingContext } from "@/lib/ai/prompts";

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
    // COMMENTED OUT: Addepar portfolio data fetching temporarily disabled
    let portfolioData: BriefingContext["portfolioData"];
    // if (type === "portfolio") {
    //   try {
    //     // Parse preferences JSON to get addeparEntityId
    //     let addeparEntityId: string | undefined;
    //     if (dbUser.preferences) {
    //       try {
    //         const preferences = JSON.parse(dbUser.preferences);
    //         addeparEntityId = preferences.addeparEntityId;
    //       } catch (e) {
    //         // If parsing fails, preferences might be invalid JSON
    //         console.error("Failed to parse user preferences:", e);
    //       }
    //     }

    //     if (addeparEntityId) {
    //       console.log(
    //         `[Briefings] Fetching portfolio data for entity ID: ${addeparEntityId}`
    //       );
    //       const addeparClient = getAddeparClient();
    //       portfolioData = await addeparClient.getPortfolioData(addeparEntityId);
    //       console.log(`[Briefings] Successfully retrieved portfolio data:`, {
    //         totalValue: portfolioData?.totalValue,
    //         holdingsCount: portfolioData?.holdings.length,
    //         hasData: !!portfolioData,
    //       });
    //     } else {
    //       console.log(
    //         `[Briefings] No Addepar Entity ID found in user preferences for portfolio briefing`
    //       );
    //     }
    //   } catch (error) {
    //     console.error("[Briefings] Failed to fetch portfolio data:", error);
    //   }
    // }

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

    // Convert briefing content to string for risk scoring
    const contentText = [
      briefingContent.title,
      briefingContent.summary,
      ...briefingContent.sections.map((s) => `${s.heading}\n${s.content}`),
      ...briefingContent.keyTakeaways,
    ].join("\n\n");

    // Search for citations (using same query as generation)
    let searchResults: SearchResult[] = [];
    try {
      const searchQuery =
        type === "market"
          ? "weekly market trends economic conditions"
          : "portfolio performance investment strategies";

      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const startDate = twoWeeksAgo.toISOString();
      const endDate = now.toISOString();
      const dateFilter = `MeetingDate gt '${startDate}' and MeetingDate lt '${endDate}'`;

      searchResults = await searchVector(searchQuery, {
        top: 5,
        filter: dateFilter,
      });
    } catch (error) {
      console.error("[Briefings] Failed to search for citations:", error);
    }

    // Save briefing first (we need the ID for citations)
    const briefing = await prisma.briefing.create({
      data: {
        userId,
        tenantId,
        type,
        content: JSON.stringify(briefingContent),
        weekStartDate,
      },
    });

    // Extract and store citations (now that we have contentId)
    let citations: Citation[] = [];
    try {
      const extractedCitations = await extractCitations(
        contentText,
        searchResults,
        briefing.id,
        "briefing",
        tenantId
      );

      // Store citations
      if (extractedCitations.length > 0) {
        citations = await storeCitations(extractedCitations);
        await updateContentCitations(briefing.id, "briefing", citations);
      }
    } catch (error) {
      console.error("[Briefings] Failed to extract citations:", error);
    }

    // Calculate risk score
    let riskScore = 0;
    let requiresReview = false;
    try {
      const riskResult = await calculateMultiFactorRiskScore(
        contentText,
        "briefing",
        citations,
        userId,
        tenantId,
        {
          topics: briefingContent.sections.map((s) => s.heading),
          wordCount: contentText.split(/\s+/).length,
        }
      );

      riskScore = riskResult.totalScore;
      requiresReview = riskResult.requiresReview;

      console.log(`[Briefings] Risk score calculated:`, {
        riskScore,
        requiresReview,
        factors: riskResult.factors,
      });
    } catch (error) {
      console.error("[Briefings] Failed to calculate risk score:", error);
    }

    // Update briefing with risk score, requiresReview, and citations
    const updatedBriefing = await prisma.briefing.update({
      where: { id: briefing.id },
      data: {
        riskScore,
        requiresReview,
        citations: citations.length > 0 ? JSON.stringify(citations) : null,
      },
    });

    // Create ContentReview if review is required
    if (requiresReview) {
      try {
        await prisma.contentReview.create({
          data: {
            contentId: updatedBriefing.id,
            contentType: "briefing",
            status: "pending_review",
            version: updatedBriefing.version,
          },
        });
        console.log(
          `[Briefings] Created review for briefing ${updatedBriefing.id}`
        );
      } catch (error) {
        console.error("[Briefings] Failed to create review:", error);
      }
    }

    // Log content generation for audit
    try {
      await logContentGeneration(
        tenantId,
        userId,
        "briefing",
        updatedBriefing.id,
        `Generate ${type} briefing`,
        contentText,
        {
          type,
          riskScore,
          requiresReview,
          citations: citations,
        }
      );
    } catch (error) {
      console.error("[Briefings] Failed to log content generation:", error);
    }

    return NextResponse.json({ briefing: updatedBriefing });
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

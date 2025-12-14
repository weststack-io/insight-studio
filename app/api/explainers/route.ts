import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { generateExplainer } from "@/lib/ai/generators";
import { Language } from "@/types";
import { searchVector, SearchResult } from "@/lib/azure/search";
import {
  extractCitations,
  storeCitations,
  updateContentCitations,
  type Citation,
} from "@/lib/compliance/citations";
import { calculateMultiFactorRiskScore } from "@/lib/compliance/risk-scoring";
import { logContentGeneration } from "@/lib/compliance/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get("topic");
    const language =
      (searchParams.get("language") as Language) || user.language || "en";

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Check if explainer exists in cache
    const existingExplainer = await prisma.explainer.findUnique({
      where: {
        tenantId_topic_language: {
          tenantId,
          topic,
          language,
        },
      },
    });

    if (existingExplainer && existingExplainer.cached) {
      return NextResponse.json({ explainer: existingExplainer });
    }

    // Generate new explainer
    const explainerContent = await generateExplainer({
      topic,
      language,
      sophisticationLevel: user.sophisticationLevel as any,
    });

    // Convert explainer content to string for risk scoring
    const contentText = [
      explainerContent.title,
      explainerContent.summary,
      explainerContent.content,
      ...explainerContent.keyPoints,
    ].join("\n\n");

    // Search for citations
    let searchResults: SearchResult[] = [];
    try {
      searchResults = await searchVector(topic, { top: 5 });
    } catch (error) {
      console.error("[Explainers] Failed to search for citations:", error);
    }

    // Save to database first (we need the ID for citations)
    const explainer = await prisma.explainer.upsert({
      where: {
        tenantId_topic_language: {
          tenantId,
          topic,
          language,
        },
      },
      create: {
        tenantId,
        topic,
        content: JSON.stringify(explainerContent),
        language,
        cached: true,
      },
      update: {
        content: JSON.stringify(explainerContent),
        generatedAt: new Date(),
        cached: true,
      },
    });

    // Extract and store citations
    let citations: Citation[] = [];
    try {
      const extractedCitations = await extractCitations(
        contentText,
        searchResults,
        explainer.id,
        "explainer",
        tenantId
      );

      if (extractedCitations.length > 0) {
        citations = await storeCitations(extractedCitations);
        await updateContentCitations(explainer.id, "explainer", citations);
      }
    } catch (error) {
      console.error("[Explainers] Failed to extract citations:", error);
    }

    // Calculate risk score
    let riskScore = 0;
    let requiresReview = false;
    try {
      const riskResult = await calculateMultiFactorRiskScore(
        contentText,
        "explainer",
        citations,
        user.id,
        tenantId,
        {
          topics: [topic, ...explainerContent.relatedTopics],
          wordCount: contentText.split(/\s+/).length,
        }
      );

      riskScore = riskResult.totalScore;
      requiresReview = riskResult.requiresReview;

      console.log(`[Explainers] Risk score calculated:`, {
        riskScore,
        requiresReview,
        factors: riskResult.factors,
      });
    } catch (error) {
      console.error("[Explainers] Failed to calculate risk score:", error);
    }

    // Update explainer with risk score, requiresReview, and citations
    const updatedExplainer = await prisma.explainer.update({
      where: { id: explainer.id },
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
            contentId: updatedExplainer.id,
            contentType: "explainer",
            status: "pending_review",
            version: 1,
          },
        });
        console.log(
          `[Explainers] Created review for explainer ${updatedExplainer.id}`
        );
      } catch (error) {
        console.error("[Explainers] Failed to create review:", error);
      }
    }

    // Log content generation for audit
    try {
      await logContentGeneration(
        tenantId,
        user.id,
        "explainer",
        updatedExplainer.id,
        `Generate explainer: ${topic}`,
        contentText,
        {
          topic,
          language,
          riskScore,
          requiresReview,
          citations: citations,
        }
      );
    } catch (error) {
      console.error("[Explainers] Failed to log content generation:", error);
    }

    return NextResponse.json({ explainer: updatedExplainer });
  } catch (error) {
    console.error("Failed to get explainer:", error);
    return NextResponse.json(
      { error: "Failed to get explainer" },
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
    const tenantId = user.tenantId;
    const body = await request.json();
    const { topic, language } = body as { topic: string; language?: Language };

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const lang = language || user.language || "en";

    // Generate explainer
    const explainerContent = await generateExplainer({
      topic,
      language: lang,
      sophisticationLevel: user.sophisticationLevel as any,
    });

    // Convert explainer content to string for risk scoring
    const contentText = [
      explainerContent.title,
      explainerContent.summary,
      explainerContent.content,
      ...explainerContent.keyPoints,
    ].join("\n\n");

    // Search for citations
    let searchResults: SearchResult[] = [];
    try {
      searchResults = await searchVector(topic, { top: 5 });
    } catch (error) {
      console.error("[Explainers] Failed to search for citations:", error);
    }

    // Save to database first (we need the ID for citations)
    const explainer = await prisma.explainer.upsert({
      where: {
        tenantId_topic_language: {
          tenantId,
          topic,
          language: lang,
        },
      },
      create: {
        tenantId,
        topic,
        content: JSON.stringify(explainerContent),
        language: lang,
        cached: true,
      },
      update: {
        content: JSON.stringify(explainerContent),
        generatedAt: new Date(),
        cached: true,
      },
    });

    // Extract and store citations
    let citations: Citation[] = [];
    try {
      const extractedCitations = await extractCitations(
        contentText,
        searchResults,
        explainer.id,
        "explainer",
        tenantId
      );

      if (extractedCitations.length > 0) {
        citations = await storeCitations(extractedCitations);
        await updateContentCitations(explainer.id, "explainer", citations);
      }
    } catch (error) {
      console.error("[Explainers] Failed to extract citations:", error);
    }

    // Calculate risk score
    let riskScore = 0;
    let requiresReview = false;
    try {
      const riskResult = await calculateMultiFactorRiskScore(
        contentText,
        "explainer",
        citations,
        user.id,
        tenantId,
        {
          topics: [topic, ...explainerContent.relatedTopics],
          wordCount: contentText.split(/\s+/).length,
        }
      );

      riskScore = riskResult.totalScore;
      requiresReview = riskResult.requiresReview;

      console.log(`[Explainers] Risk score calculated:`, {
        riskScore,
        requiresReview,
        factors: riskResult.factors,
      });
    } catch (error) {
      console.error("[Explainers] Failed to calculate risk score:", error);
    }

    // Update explainer with risk score, requiresReview, and citations
    const updatedExplainer = await prisma.explainer.update({
      where: { id: explainer.id },
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
            contentId: updatedExplainer.id,
            contentType: "explainer",
            status: "pending_review",
            version: 1,
          },
        });
        console.log(
          `[Explainers] Created review for explainer ${updatedExplainer.id}`
        );
      } catch (error) {
        console.error("[Explainers] Failed to create review:", error);
      }
    }

    // Log content generation for audit
    try {
      await logContentGeneration(
        tenantId,
        user.id,
        "explainer",
        updatedExplainer.id,
        `Generate explainer: ${topic}`,
        contentText,
        {
          topic,
          language: lang,
          riskScore,
          requiresReview,
          citations: citations,
        }
      );
    } catch (error) {
      console.error("[Explainers] Failed to log content generation:", error);
    }

    return NextResponse.json({ explainer: updatedExplainer });
  } catch (error) {
    console.error("Failed to generate explainer:", error);
    return NextResponse.json(
      { error: "Failed to generate explainer" },
      { status: 500 }
    );
  }
}

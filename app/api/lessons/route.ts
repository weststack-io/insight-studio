import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { generateLesson } from "@/lib/ai/generators";
import { Language, Generation } from "@/types";
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
    const generation = searchParams.get("generation") as Generation | null;
    const language =
      (searchParams.get("language") as Language) || user.language || "en";
    const sophisticationLevel =
      searchParams.get("sophisticationLevel") || user.sophisticationLevel;

    const where: any = {
      tenantId,
      language,
    };

    if (topic) {
      where.topic = { contains: topic };
    }

    if (generation) {
      where.generation = generation;
    }

    if (sophisticationLevel) {
      where.sophisticationLevel = sophisticationLevel;
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: {
        generatedAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Failed to fetch lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
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
    const { topic, generation, language, sophisticationLevel } = body as {
      topic: string;
      generation?: Generation;
      language?: Language;
      sophisticationLevel?: string;
    };

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const lang = language || user.language || "en";
    const gen = generation || user.generation;
    const sophLevel = sophisticationLevel || user.sophisticationLevel;

    // Generate lesson
    const lessonContent = await generateLesson({
      topic,
      generation: gen,
      language: lang,
      sophisticationLevel: sophLevel as any,
    });

    // Convert lesson content to string for risk scoring
    const contentText = [
      lessonContent.title,
      lessonContent.content,
      ...lessonContent.keyTakeaways,
    ].join("\n\n");

    // Search for citations
    let searchResults: SearchResult[] = [];
    try {
      searchResults = await searchVector(topic, { top: 3 });
    } catch (error) {
      console.error("[Lessons] Failed to search for citations:", error);
    }

    // Save to database first (we need the ID for citations)
    const lesson = await prisma.lesson.create({
      data: {
        tenantId,
        topic,
        content: JSON.stringify(lessonContent),
        generation: gen,
        language: lang,
        sophisticationLevel: sophLevel,
      },
    });

    // Extract and store citations
    let citations: Citation[] = [];
    try {
      const extractedCitations = await extractCitations(
        contentText,
        searchResults,
        lesson.id,
        "lesson",
        tenantId
      );

      if (extractedCitations.length > 0) {
        citations = await storeCitations(extractedCitations);
        await updateContentCitations(lesson.id, "lesson", citations);
      }
    } catch (error) {
      console.error("[Lessons] Failed to extract citations:", error);
    }

    // Calculate risk score
    let riskScore = 0;
    let requiresReview = false;
    try {
      const riskResult = await calculateMultiFactorRiskScore(
        contentText,
        "lesson",
        citations,
        user.id,
        tenantId,
        {
          topics: [topic],
          wordCount: contentText.split(/\s+/).length,
        }
      );

      riskScore = riskResult.totalScore;
      requiresReview = riskResult.requiresReview;

      console.log(`[Lessons] Risk score calculated:`, {
        riskScore,
        requiresReview,
        factors: riskResult.factors,
      });
    } catch (error) {
      console.error("[Lessons] Failed to calculate risk score:", error);
    }

    // Update lesson with risk score, requiresReview, and citations
    const updatedLesson = await prisma.lesson.update({
      where: { id: lesson.id },
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
            contentId: updatedLesson.id,
            contentType: "lesson",
            status: "pending_review",
            version: 1,
          },
        });
        console.log(`[Lessons] Created review for lesson ${updatedLesson.id}`);
      } catch (error) {
        console.error("[Lessons] Failed to create review:", error);
      }
    }

    // Log content generation for audit
    try {
      await logContentGeneration(
        tenantId,
        user.id,
        "lesson",
        updatedLesson.id,
        `Generate lesson: ${topic}`,
        contentText,
        {
          topic,
          generation: gen,
          language: lang,
          sophisticationLevel: sophLevel,
          riskScore,
          requiresReview,
          citations: citations,
        }
      );
    } catch (error) {
      console.error("[Lessons] Failed to log content generation:", error);
    }

    return NextResponse.json({ lesson: updatedLesson });
  } catch (error) {
    console.error("Failed to generate lesson:", error);
    return NextResponse.json(
      { error: "Failed to generate lesson" },
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

    const user = session.user as any;
    const tenantId = user.tenantId;
    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get("id");

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Verify the lesson belongs to the tenant
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.tenantId !== tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}

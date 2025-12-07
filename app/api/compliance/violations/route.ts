import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { evaluatePolicies } from "@/lib/compliance/policy-engine";

// GET - Get policy violations for content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const contentId = searchParams.get("contentId");
    const contentType = searchParams.get("contentType") as
      | "briefing"
      | "explainer"
      | "lesson"
      | null;

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: "contentId and contentType are required" },
        { status: 400 }
      );
    }

    // Get content
    let content: any = null;
    if (contentType === "briefing") {
      content = await prisma.briefing.findUnique({
        where: { id: contentId },
      });
    } else if (contentType === "explainer") {
      content = await prisma.explainer.findUnique({
        where: { id: contentId },
      });
    } else if (contentType === "lesson") {
      content = await prisma.lesson.findUnique({
        where: { id: contentId },
      });
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Parse content
    let contentText = "";
    try {
      const parsed = JSON.parse(content.content);
      contentText = parsed.content || parsed.summary || JSON.stringify(parsed);
    } catch {
      contentText = content.content;
    }

    // Get citations if available
    const citations = content.citations
      ? JSON.parse(content.citations)
      : [];

    // Evaluate policies
    const result = await evaluatePolicies(
      tenantId,
      contentText,
      contentType,
      {
        citations,
        riskScore: content.riskScore || undefined,
        wordCount: contentText.split(/\s+/).length,
      }
    );

    return NextResponse.json({
      violations: result.violations,
      requiresReview: result.requiresReview,
      blocked: result.blocked,
      passed: result.passed,
    });
  } catch (error) {
    console.error("Failed to get violations:", error);
    return NextResponse.json(
      { error: "Failed to get violations" },
      { status: 500 }
    );
  }
}


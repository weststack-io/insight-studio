import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getContentSources,
  ingestRSSFeed,
  createPDFSource,
  calculateReliabilityScore,
} from "@/lib/ingestion/content-sources";
import { PrismaClient } from "@prisma/client";
import { createMssqlAdapter } from "@/lib/db/adapter";

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});

// GET - List content sources
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const sources = await getContentSources(tenantId, {
      type: type || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error("Failed to fetch sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// POST - Create content source or trigger ingestion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Only advisors can manage sources
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can manage sources" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...config } = body;

    if (action === "ingest_rss") {
      const { url, title, tags, reliabilityScore } = config;
      if (!url) {
        return NextResponse.json(
          { error: "RSS feed URL is required" },
          { status: 400 }
        );
      }

      const result = await ingestRSSFeed(
        {
          url,
          title,
          tags,
          reliabilityScore,
        },
        tenantId
      );

      return NextResponse.json({ result });
    } else if (action === "create_pdf") {
      const { url, title, tags, reliabilityScore } = config;
      if (!url || !title) {
        return NextResponse.json(
          { error: "PDF URL and title are required" },
          { status: 400 }
        );
      }

      const sourceId = await createPDFSource(
        {
          url,
          title,
          tags,
          reliabilityScore,
        },
        tenantId
      );

      return NextResponse.json({ sourceId });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'ingest_rss' or 'create_pdf'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to process source request:", error);
    return NextResponse.json(
      { error: "Failed to process source request" },
      { status: 500 }
    );
  }
}

// PATCH - Update source reliability score
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only advisors can update sources
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can update sources" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sourceId, action } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    if (action === "calculate_reliability") {
      const result = await calculateReliabilityScore(sourceId);
      return NextResponse.json({ result });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'calculate_reliability'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to update source:", error);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}


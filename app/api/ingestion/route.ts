import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { PrismaClient } from "@prisma/client";
import { createMssqlAdapter } from "@/lib/db/adapter";

const prisma = new PrismaClient({
  adapter: createMssqlAdapter(),
});

// GET - List ingestion configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Only advisors can view ingestion configurations
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can view ingestion configurations" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sourceType = searchParams.get("sourceType");
    const status = searchParams.get("status");

    const where: any = {};
    if (sourceType) {
      where.sourceType = sourceType;
    }
    if (status) {
      where.status = status;
    }

    const ingestions = await prisma.contentIngestion.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by tenant if tenantId is in config
    const filtered = ingestions.filter((ingestion) => {
      try {
        const config = JSON.parse(ingestion.config);
        return !config.tenantId || config.tenantId === tenantId;
      } catch {
        return true;
      }
    });

    return NextResponse.json({ ingestions: filtered });
  } catch (error) {
    console.error("Failed to fetch ingestion configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingestion configurations" },
      { status: 500 }
    );
  }
}

// POST - Create or update ingestion configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    // Only advisors can manage ingestion configurations
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can manage ingestion configurations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sourceType, config, schedule, status } = body;

    if (!sourceType || !config) {
      return NextResponse.json(
        { error: "sourceType and config are required" },
        { status: 400 }
      );
    }

    // Add tenantId to config if not present
    const configWithTenant = {
      ...config,
      tenantId: config.tenantId || tenantId,
      schedule: schedule || "daily",
    };

    // Calculate next run time
    const now = new Date();
    let nextRun: Date | null = null;
    switch (schedule || "daily") {
      case "hourly":
        nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case "daily":
        nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const ingestion = await prisma.contentIngestion.create({
      data: {
        sourceType,
        config: JSON.stringify(configWithTenant),
        status: status || "active",
        nextRun,
      },
    });

    return NextResponse.json({ ingestion });
  } catch (error) {
    console.error("Failed to create ingestion configuration:", error);
    return NextResponse.json(
      { error: "Failed to create ingestion configuration" },
      { status: 500 }
    );
  }
}

// DELETE - Delete ingestion configuration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Only advisors can delete ingestion configurations
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can delete ingestion configurations" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.contentIngestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ingestion configuration:", error);
    return NextResponse.json(
      { error: "Failed to delete ingestion configuration" },
      { status: 500 }
    );
  }
}


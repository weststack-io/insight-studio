import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getTenantPolicies,
  getPoliciesByType,
  upsertPolicy,
  deletePolicy,
  PolicyType,
  PolicyConfig,
  getDefaultPolicyConfig,
} from "@/lib/compliance/policy-engine";

// GET - List policies for tenant
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

    // Only advisors can view policies
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can view policies" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as PolicyType | null;

    let policies;
    if (type) {
      policies = await getPoliciesByType(tenantId, type);
    } else {
      policies = await getTenantPolicies(tenantId);
    }

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Failed to fetch policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}

// POST - Create or update policy
export async function POST(request: NextRequest) {
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

    // Only advisors can manage policies
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can manage policies" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, type, config, enabled } = body as {
      name: string;
      type: PolicyType;
      config?: PolicyConfig;
      enabled?: boolean;
    };

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }

    // Use default config if not provided
    const policyConfig = config || getDefaultPolicyConfig(type);

    const policy = await upsertPolicy(
      tenantId,
      name,
      type,
      policyConfig,
      enabled !== undefined ? enabled : true
    );

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Failed to create/update policy:", error);
    return NextResponse.json(
      { error: "Failed to create/update policy" },
      { status: 500 }
    );
  }
}

// DELETE - Delete policy
export async function DELETE(request: NextRequest) {
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

    // Only advisors can delete policies
    if (user.role !== "advisor") {
      return NextResponse.json(
        { error: "Only advisors can delete policies" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Policy name is required" },
        { status: 400 }
      );
    }

    await deletePolicy(tenantId, name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete policy:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}


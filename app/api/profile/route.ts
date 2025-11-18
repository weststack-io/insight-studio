import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        language: true,
        generation: true,
        sophisticationLevel: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const { name, language, generation, sophisticationLevel, addeparPortfolioId } = body as {
      name?: string;
      language?: string;
      generation?: string | null;
      sophisticationLevel?: string | null;
      addeparPortfolioId?: string | null;
    };

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;
    if (generation !== undefined) updateData.generation = generation || null;
    if (sophisticationLevel !== undefined) {
      updateData.sophisticationLevel = sophisticationLevel || null;
    }

    // Handle preferences JSON field for addeparPortfolioId
    if (addeparPortfolioId !== undefined) {
      // Get current user to read existing preferences
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      });

      // Parse existing preferences or start with empty object
      let preferences: any = {};
      if (currentUser?.preferences) {
        try {
          preferences = JSON.parse(currentUser.preferences);
        } catch (e) {
          // If parsing fails, start with empty object
          preferences = {};
        }
      }

      // Update addeparPortfolioId in preferences
      if (addeparPortfolioId === null || addeparPortfolioId === '') {
        delete preferences.addeparPortfolioId;
      } else {
        preferences.addeparPortfolioId = addeparPortfolioId;
      }

      // Stringify and update
      updateData.preferences = JSON.stringify(preferences);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        language: true,
        generation: true,
        sophisticationLevel: true,
        preferences: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

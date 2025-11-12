import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { generateBriefing } from '@/lib/ai/generators';
import { getAddeparClient } from '@/lib/addepar/client';
import { BriefingType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as BriefingType | null;
    const weekStart = searchParams.get('weekStart');

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
        weekStartDate: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({ briefings });
  } catch (error) {
    console.error('Failed to fetch briefings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch briefings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get portfolio data if portfolio briefing
    let portfolioData;
    if (type === 'portfolio') {
      // For MVP, we'll need to store Addepar entity ID in user profile or preferences
      // For now, we'll try to fetch if available
      try {
        const addeparEntityId = (dbUser.preferences as any)?.addeparEntityId;
        if (addeparEntityId) {
          const addeparClient = getAddeparClient();
          portfolioData = await addeparClient.getPortfolioData(addeparEntityId);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
      }
    }

    // Generate briefing
    const briefingContent = await generateBriefing({
      type,
      portfolioData,
      language: dbUser.language as any,
      generation: dbUser.generation as any,
      sophisticationLevel: dbUser.sophisticationLevel as any,
      userPreferences: dbUser.userPreferences.map(p => p.topic),
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
    console.error('Failed to generate briefing:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}


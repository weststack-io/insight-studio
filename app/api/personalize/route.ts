import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { getAddeparClient } from '@/lib/addepar/client';
import { Briefing, Explainer, Lesson } from '@/types';

interface PersonalizedContent {
  briefings: Briefing[];
  explainers: Explainer[];
  lessons: Lesson[];
  recommendedTopics: string[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const tenantId = user.tenantId;

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

    // Get portfolio data for personalization
    let portfolioData = null;
    try {
      // Parse preferences JSON to get addeparEntityId
      let addeparEntityId: string | undefined;
      if (dbUser.preferences) {
        try {
          const preferences = JSON.parse(dbUser.preferences);
          addeparEntityId = preferences.addeparEntityId;
        } catch (e) {
          // If parsing fails, preferences might be invalid JSON
          console.error('Failed to parse user preferences:', e);
        }
      }
      
      if (addeparEntityId) {
        console.log(`[Personalize] Fetching portfolio data for entity ID: ${addeparEntityId}`);
        const addeparClient = getAddeparClient();
        portfolioData = await addeparClient.getPortfolioData(addeparEntityId);
        console.log(`[Personalize] Successfully retrieved portfolio data:`, {
          totalValue: portfolioData?.totalValue,
          holdingsCount: portfolioData?.holdings.length,
          hasData: !!portfolioData,
        });
      } else {
        console.log(`[Personalize] No Addepar Entity ID found in user preferences`);
      }
    } catch (error) {
      console.error('[Personalize] Failed to fetch portfolio data:', error);
    }

    // Get user's preferred topics
    const preferredTopics = dbUser.userPreferences
      .filter(p => p.interestLevel === 'high')
      .map(p => p.topic);

    // Get recent briefings
    const briefings = await prisma.briefing.findMany({
      where: { userId, tenantId },
      orderBy: { weekStartDate: 'desc' },
      take: 5,
    });

    // Get explainers for preferred topics
    const explainers = await prisma.explainer.findMany({
      where: {
        tenantId,
        ...(dbUser.language && { language: dbUser.language }),
        ...(preferredTopics.length > 0 && {
          topic: { in: preferredTopics },
        }),
      },
      orderBy: { generatedAt: 'desc' },
      take: 5,
    });

    // Get lessons matching user profile
    const lessons = await prisma.lesson.findMany({
      where: {
        tenantId,
        ...(dbUser.language && { language: dbUser.language }),
        ...(dbUser.generation && { generation: dbUser.generation }),
        ...(dbUser.sophisticationLevel && {
          sophisticationLevel: dbUser.sophisticationLevel,
        }),
      },
      orderBy: { generatedAt: 'desc' },
      take: 5,
    });

    // Generate recommended topics based on portfolio
    const recommendedTopics: string[] = [];
    if (portfolioData) {
      console.log(`[Personalize] Generating recommended topics from portfolio data:`, {
        holdingsCount: portfolioData.holdings.length,
        totalValue: portfolioData.totalValue,
      });
      
      const assetClasses = portfolioData.holdings
        .map(h => h.assetClass)
        .filter(Boolean) as string[];
      const uniqueAssetClasses = [...new Set(assetClasses)];

      console.log(`[Personalize] Found asset classes in portfolio:`, uniqueAssetClasses);

      // Map asset classes to educational topics
      const topicMap: Record<string, string[]> = {
        'Equity': ['Stock Market Basics', 'Dividend Investing', 'Growth vs Value'],
        'Fixed Income': ['Bond Investing', 'Municipal Bond Ladders', 'Interest Rate Risk'],
        'Alternative': ['Alternative Investments', 'Private Equity', 'Hedge Funds'],
        'Real Estate': ['REITs', 'Real Estate Investing', 'Property Investment Strategies'],
      };

      uniqueAssetClasses.forEach(assetClass => {
        const topics = topicMap[assetClass] || [];
        recommendedTopics.push(...topics);
      });
      
      console.log(`[Personalize] Generated ${recommendedTopics.length} recommended topics from portfolio`);
    } else {
      console.log(`[Personalize] No portfolio data available, skipping topic recommendations`);
    }

    const personalizedContent: PersonalizedContent = {
      briefings: briefings as Briefing[],
      explainers: explainers as Explainer[],
      lessons: lessons as Lesson[],
      recommendedTopics: [...new Set(recommendedTopics)],
    };

    return NextResponse.json({ content: personalizedContent });
  } catch (error) {
    console.error('Failed to get personalized content:', error);
    return NextResponse.json(
      { error: 'Failed to get personalized content' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { generateExplainer } from '@/lib/ai/generators';
import { Language } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get('topic');
    const language = (searchParams.get('language') as Language) || user.language || 'en';

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
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

    // Save to database
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

    return NextResponse.json({ explainer });
  } catch (error) {
    console.error('Failed to get explainer:', error);
    return NextResponse.json(
      { error: 'Failed to get explainer' },
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
    const tenantId = user.tenantId;
    const body = await request.json();
    const { topic, language } = body as { topic: string; language?: Language };

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const lang = language || user.language || 'en';

    // Generate explainer
    const explainerContent = await generateExplainer({
      topic,
      language: lang,
      sophisticationLevel: user.sophisticationLevel as any,
    });

    // Save to database
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

    return NextResponse.json({ explainer });
  } catch (error) {
    console.error('Failed to generate explainer:', error);
    return NextResponse.json(
      { error: 'Failed to generate explainer' },
      { status: 500 }
    );
  }
}


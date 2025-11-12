import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { generateLesson } from '@/lib/ai/generators';
import { Language, Generation } from '@/types';

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
    const generation = searchParams.get('generation') as Generation | null;
    const language = (searchParams.get('language') as Language) || user.language || 'en';
    const sophisticationLevel = searchParams.get('sophisticationLevel') || user.sophisticationLevel;

    const where: any = {
      tenantId,
      language,
    };

    if (topic) {
      where.topic = { contains: topic, mode: 'insensitive' };
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
        generatedAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Failed to fetch lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
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
    const {
      topic,
      generation,
      language,
      sophisticationLevel,
    } = body as {
      topic: string;
      generation?: Generation;
      language?: Language;
      sophisticationLevel?: string;
    };

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const lang = language || user.language || 'en';
    const gen = generation || user.generation;
    const sophLevel = sophisticationLevel || user.sophisticationLevel;

    // Generate lesson
    const lessonContent = await generateLesson({
      topic,
      generation: gen,
      language: lang,
      sophisticationLevel: sophLevel as any,
    });

    // Save to database
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

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('Failed to generate lesson:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    );
  }
}


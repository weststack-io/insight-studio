import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { InterestLevel } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      orderBy: { interestLevel: 'desc' },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
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

    const userId = (session.user as any).id;
    const body = await request.json();
    const { topic, interestLevel } = body as {
      topic: string;
      interestLevel: InterestLevel;
    };

    if (!topic || !interestLevel) {
      return NextResponse.json(
        { error: 'Topic and interestLevel are required' },
        { status: 400 }
      );
    }

    const preference = await prisma.userPreference.upsert({
      where: {
        userId_topic: {
          userId,
          topic,
        },
      },
      create: {
        userId,
        topic,
        interestLevel,
      },
      update: {
        interestLevel,
      },
    });

    return NextResponse.json({ preference });
  } catch (error) {
    console.error('Failed to save preference:', error);
    return NextResponse.json(
      { error: 'Failed to save preference' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get('topic');

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    await prisma.userPreference.delete({
      where: {
        userId_topic: {
          userId,
          topic,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete preference:', error);
    return NextResponse.json(
      { error: 'Failed to delete preference' },
      { status: 500 }
    );
  }
}


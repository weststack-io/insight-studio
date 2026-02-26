import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const contentType = searchParams.get('contentType');
    const period = searchParams.get('period') || '30d';
    const sort = searchParams.get('sort') || 'engagementScore';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Calculate date filter from period
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - periodDays);

    const where: any = {
      tenantId,
      updatedAt: { gte: startDate },
    };
    if (contentType) {
      where.contentType = contentType;
    }

    const validSortFields = [
      'engagementScore',
      'totalOpens',
      'completionRate',
      'avgDwellTime',
      'avgRating',
    ];
    const orderByField = validSortFields.includes(sort)
      ? sort
      : 'engagementScore';

    const metrics = await prisma.engagementMetrics.findMany({
      where,
      orderBy: { [orderByField]: 'desc' },
      take: Math.min(limit, 100),
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

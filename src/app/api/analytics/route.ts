import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    return user?.role === 'ADMIN' ? payload : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 29);
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

  const [total, last30, last7, today, recentViews, topPagesRaw] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.pageView.groupBy({
      by: ['path'],
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
  ]);

  // Build day-by-day counts for the last 30 days
  const dayMap: Record<string, number> = {};
  for (const v of recentViews) {
    const d = v.createdAt.toISOString().slice(0, 10);
    dayMap[d] = (dayMap[d] || 0) + 1;
  }

  const byDay: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    byDay.push({ date: dateStr, count: dayMap[dateStr] || 0 });
  }

  const topPages = topPagesRaw.map(r => ({ path: r.path, count: r._count.path }));

  return NextResponse.json({ total, last30, last7, today, byDay, topPages });
}

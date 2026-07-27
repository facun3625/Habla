import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let userId: number;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      OR: [
        { status: 'CONFIRMADA' },
        { status: 'COMPROBANTE_SUBIDO', installmentPlan: { isNot: null } },
      ],
    },
    select: {
      course: {
        select: { id: true, title: true, gateStep1Content: true },
      },
    },
  });

  const withGate = enrollments
    .map((e) => e.course)
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
    .filter((c) => c.gateStep1Content && c.gateStep1Content.trim());

  if (withGate.length === 0) return NextResponse.json([]);

  const progressRows = await prisma.connectionGateProgress.findMany({
    where: { userId, courseId: { in: withGate.map((c) => c.id) } },
    select: { courseId: true, completedAt: true },
  });
  const completedIds = new Set(progressRows.filter((p) => p.completedAt).map((p) => p.courseId));

  const pending = withGate
    .filter((c) => !completedIds.has(c.id))
    .map((c) => ({ courseId: c.id, title: c.title }));

  return NextResponse.json(pending);
}

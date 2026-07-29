import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { isInstallmentPlanSettled } from '@/lib/installments';

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

  const settings = await getSettings([
    'installments_gate_enabled',
    'installments_gate_title',
    'installments_gate_message',
  ]);

  if (settings.installments_gate_enabled !== 'true') {
    return NextResponse.json({ enabled: false, title: '', message: '', courses: [] });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      OR: [
        { status: 'CONFIRMADA' },
        { status: 'COMPROBANTE_SUBIDO', installmentPlan: { isNot: null } },
      ],
    },
    include: {
      course: { select: { id: true, title: true } },
      installmentPlan: { include: { installments: true } },
    },
  });

  const courses = enrollments
    .filter((e) => e.installmentPlan && !isInstallmentPlanSettled(e.installmentPlan.installments))
    .map((e) => ({ courseId: e.course.id, title: e.course.title }));

  return NextResponse.json({
    enabled: true,
    title: settings.installments_gate_title ?? '',
    message: settings.installments_gate_message ?? '',
    courses,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
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

  const gateOnInstallments = await getSetting('installments_gate_enabled');

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
      installmentPlan: { include: { installments: true } },
    },
  });

  // Si el bloqueo por cuotas está activo, no mostrar el popup de "aceptar términos"
  // para cursos donde el alumno todavía no saldó las cuotas: primero va a ver el popup de cuotas.
  const withGate = enrollments
    .filter((e) => gateOnInstallments !== 'true' || isInstallmentPlanSettled(e.installmentPlan?.installments))
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

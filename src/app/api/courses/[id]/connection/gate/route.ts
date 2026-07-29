import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { isInstallmentPlanSettled } from '@/lib/installments';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const courseId = parseInt(id);

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let userId: number;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId, userId,
      OR: [
        { status: 'CONFIRMADA' },
        { status: 'COMPROBANTE_SUBIDO', installmentPlan: { isNot: null } },
      ],
    },
    include: { installmentPlan: { include: { installments: true } } },
  });
  if (!enrollment) return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });

  const gateOnInstallments = await getSetting('installments_gate_enabled');
  if (gateOnInstallments === 'true' && !isInstallmentPlanSettled(enrollment.installmentPlan?.installments)) {
    return NextResponse.json({ error: 'INSTALLMENTS_PENDING' }, { status: 403 });
  }

  const body = await req.json();
  const step = body.step;
  if (![1, 2, 3].includes(step)) {
    return NextResponse.json({ error: 'Paso inválido' }, { status: 400 });
  }

  const progress = await prisma.connectionGateProgress.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: { courseId, userId },
    update: {},
  });

  const now = new Date();

  if (step === 1) {
    const updated = await prisma.connectionGateProgress.update({
      where: { courseId_userId: { courseId, userId } },
      data: { step1At: progress.step1At ?? now },
    });
    return NextResponse.json(updated);
  }

  if (step === 2) {
    if (!progress.step1At) return NextResponse.json({ error: 'STEP1_REQUIRED' }, { status: 400 });
    const updated = await prisma.connectionGateProgress.update({
      where: { courseId_userId: { courseId, userId } },
      data: { term1AcceptedAt: progress.term1AcceptedAt ?? now },
    });
    return NextResponse.json(updated);
  }

  // step === 3
  if (!progress.term1AcceptedAt) return NextResponse.json({ error: 'STEP2_REQUIRED' }, { status: 400 });
  const updated = await prisma.connectionGateProgress.update({
    where: { courseId_userId: { courseId, userId } },
    data: { term2AcceptedAt: now, completedAt: now },
  });
  return NextResponse.json(updated);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
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
    include: { installmentPlan: true },
  });
  if (!enrollment) return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      gateStep1Content: true,
      gateTerm1Title: true,
      gateTerm1Body: true,
      gateTerm2Title: true,
      gateTerm2Body: true,
    },
  });
  if (!course) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const progress = await prisma.connectionGateProgress.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: { courseId, userId },
    update: {},
  });

  const gate = {
    step1Content: course.gateStep1Content,
    term1Title: course.gateTerm1Title,
    term1Body: course.gateTerm1Body,
    term2Title: course.gateTerm2Title,
    term2Body: course.gateTerm2Body,
  };

  if (!progress.completedAt) {
    return NextResponse.json({ gate, progress, modules: null });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileId: true } });
  const profileId = user?.profileId ?? null;

  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: { accessProfiles: { include: { profile: true } } },
  });

  const scoped = modules.map((m) => {
    const accessible = m.accessAll || m.accessProfiles.some((a) => a.profileId === profileId);
    return accessible ? m : { ...m, connectionLink: null, connectionInfo: null };
  });

  return NextResponse.json({ gate, progress, modules: scoped });
}

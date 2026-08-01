import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { isInstallmentPlanSettled } from '@/lib/installments';
import { driveEmbedUrl } from '@/lib/googleDrive';

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
    include: { installmentPlan: { include: { installments: true } } },
  });
  if (!enrollment) return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });

  const gateOnInstallments = await getSetting('installments_gate_enabled');
  if (gateOnInstallments === 'true' && !isInstallmentPlanSettled(enrollment.installmentPlan?.installments)) {
    return NextResponse.json({ error: 'INSTALLMENTS_PENDING' }, { status: 403 });
  }

  const videos = await prisma.courseVideo.findMany({
    where: { courseId, visible: true },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, driveUrl: true },
  });

  // Nunca se devuelve el link de Drive original al alumno, solo la URL de embed:
  // así el video se ve siempre adentro de la plataforma, nunca como un link suelto para abrir/descargar aparte.
  const safeVideos = videos
    .map((v) => ({ id: v.id, title: v.title, embedUrl: driveEmbedUrl(v.driveUrl) }))
    .filter((v) => v.embedUrl !== null);

  return NextResponse.json(safeVideos);
}

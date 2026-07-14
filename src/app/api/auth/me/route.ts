import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE, IMPERSONATOR_COOKIE } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, email: true, name: true, role: true,
        phone: true, profession: true, profileId: true,
        profile: { select: { id: true, name: true } },
        createdAt: true,
        questionnaireCompleted: true,
        birthDate: true, dni: true, city: true,
        hasApraxiaExperience: true, apraxiaExperienceDetail: true,
        hasOtherTraining: true, otherTrainingDetail: true, specificMethod: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const impersonating = !!req.cookies.get(IMPERSONATOR_COOKIE)?.value;
    return NextResponse.json({ ...user, impersonating });
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

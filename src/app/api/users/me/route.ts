import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const { name, phone, profession, profileId } = await req.json();

  // Only allow profile change if no active enrollments
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (profession !== undefined) data.profession = profession;

  if (profileId !== undefined) {
    const activeEnrollments = await prisma.enrollment.count({
      where: {
        userId: payload.userId,
        status: { in: ['PENDIENTE_PAGO', 'COMPROBANTE_SUBIDO', 'CONFIRMADA'] },
      },
    });
    if (activeEnrollments > 0) {
      return NextResponse.json({ error: 'No podés cambiar el perfil mientras tenés inscripciones activas.' }, { status: 409 });
    }
    data.profileId = profileId === null ? null : Number(profileId);
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data,
    select: {
      id: true, name: true, email: true, phone: true, profession: true,
      profileId: true, profile: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(user);
}

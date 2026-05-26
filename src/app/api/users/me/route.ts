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

  const { name, phone, profession, profileId, birthDate, dni, city, hasApraxiaExperience, hasOtherTraining, specificMethod, questionnaireCompleted } = await req.json();

  // Only allow profile change if no active enrollments
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (profession !== undefined) data.profession = profession;
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
  if (dni !== undefined) data.dni = dni;
  if (city !== undefined) data.city = city;
  if (hasApraxiaExperience !== undefined) data.hasApraxiaExperience = hasApraxiaExperience;
  if (hasOtherTraining !== undefined) data.hasOtherTraining = hasOtherTraining;
  if (specificMethod !== undefined) data.specificMethod = specificMethod;
  if (questionnaireCompleted !== undefined) data.questionnaireCompleted = questionnaireCompleted;

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
      questionnaireCompleted: true, birthDate: true, dni: true, city: true,
      hasApraxiaExperience: true, hasOtherTraining: true, specificMethod: true,
    },
  });

  return NextResponse.json(user);
}

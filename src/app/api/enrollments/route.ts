import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true, title: true, coverImage: true,
            startDate: true, endDate: true, modality: true, schedule: true,
          },
        },
        profile: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(enrollments);
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });

  const { courseId, paymentMethod, credentialUrl, selectedProfileId, numInstallments, amountPerInstallment, installmentCurrency, cuotasDueDay } = await req.json();
  const effectiveProfileId = selectedProfileId ? Number(selectedProfileId) : (user.profileId ?? null);
  if (!courseId) return NextResponse.json({ error: 'Curso requerido.' }, { status: 400 });

  // Check if already enrolled
  const existing = await prisma.enrollment.findFirst({
    where: { courseId: Number(courseId), userId: user.id },
  });
  if (existing) return NextResponse.json({ error: 'Ya estás inscripto en este curso.' }, { status: 409 });

  // Check capacity for selected profile
  if (effectiveProfileId) {
    const courseProfile = await prisma.courseProfile.findUnique({
      where: { courseId_profileId: { courseId: Number(courseId), profileId: effectiveProfileId } },
    });
    if (courseProfile && courseProfile.capacity > 0) {
      const enrolled = await prisma.enrollment.count({
        where: { courseId: Number(courseId), profileId: effectiveProfileId, status: { in: ['CONFIRMADA'] } },
      });
      if (enrolled >= courseProfile.capacity) {
        return NextResponse.json({ error: 'No hay cupos disponibles para tu perfil.' }, { status: 409 });
      }
    }
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      courseId: Number(courseId),
      userId: user.id,
      profileId: effectiveProfileId,
      userName: user.name ?? '',
      email: user.email,
      status: 'PENDIENTE_PAGO',
      paymentMethod: paymentMethod ?? null,
      credentialUrl: credentialUrl ?? null,
    },
    include: { profile: true },
  });

  // Create installment plan if paying in installments
  if (numInstallments && numInstallments > 1 && amountPerInstallment) {
    const dueDay = cuotasDueDay ? Number(cuotasDueDay) : null;
    const plan = await prisma.installmentPlan.create({
      data: {
        enrollmentId: enrollment.id,
        numInstallments: Number(numInstallments),
        amountPerInstallment: Number(amountPerInstallment),
        currency: installmentCurrency ?? 'ARS',
        dueDay,
        installments: {
          create: Array.from({ length: Number(numInstallments) }, (_, i) => {
            let dueDate: Date | null = null;
            if (dueDay) {
              const d = new Date();
              d.setDate(1);
              d.setMonth(d.getMonth() + i);
              const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
              d.setDate(Math.min(dueDay, lastDay));
              dueDate = d;
            }
            return { number: i + 1, amount: Number(amountPerInstallment), dueDate };
          }),
        },
      },
    });
    return NextResponse.json({ ...enrollment, installmentPlanId: plan.id }, { status: 201 });
  }

  return NextResponse.json(enrollment, { status: 201 });
}

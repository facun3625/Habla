import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: Number(id) },
      include: { profile: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(enrollments);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const body = await req.json();
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId: Number(id),
        userName: body.userName ?? '',
        email: body.email ?? '',
        userId: body.userId ? Number(body.userId) : null,
        profileId: body.profileId ? Number(body.profileId) : null,
        status: body.status ?? 'PENDIENTE_PAGO',
        paymentMethod: body.paymentMethod ?? null,
        notes: body.notes ?? null,
      },
      include: { profile: true },
    });
    return NextResponse.json(enrollment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al crear inscripción' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id: Number(id) },
      include: {
        modules: { orderBy: { order: 'asc' } },
        courseProfiles: { include: { profile: true } },
        prices: { include: { profile: true } },
        enrollments: { include: { profile: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!course) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(course);
  } catch (e) {
    console.error('GET /api/courses/[id]', e);
    return NextResponse.json({ error: 'Error al obtener el curso' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const course = await prisma.course.update({
      where: { id: Number(id) },
      data: {
        title: body.title,
        coverImage: body.coverImage,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        modality: body.modality,
        capacity: body.capacity,
        schedule: body.schedule,
        description: body.description,
        targetAudience: body.targetAudience,
        status: body.status,
        confirmationEmailSubject: body.confirmationEmailSubject ?? undefined,
        confirmationEmail: body.confirmationEmail ?? undefined,
        objectives: body.objectives ?? undefined,
      },
    });
    return NextResponse.json(course);
  } catch (e) {
    console.error('PUT /api/courses/[id]', e);
    return NextResponse.json({ error: 'Error al actualizar el curso' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.course.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/courses/[id]', e);
    return NextResponse.json({ error: 'Error al eliminar el curso' }, { status: 500 });
  }
}

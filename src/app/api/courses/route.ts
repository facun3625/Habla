import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { enrollments: true } } },
    });
    return NextResponse.json(courses);
  } catch (e) {
    console.error('GET /api/courses', e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const course = await prisma.course.create({
      data: {
        title: body.title,
        coverImage: body.coverImage,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        modality: body.modality ?? 'VIRTUAL',
        capacity: body.capacity ?? 0,
        schedule: body.schedule,
        description: body.description,
        targetAudience: body.targetAudience,
        status: body.status ?? 'BORRADOR',
      },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (e) {
    console.error('POST /api/courses', e);
    return NextResponse.json({ error: 'Error al crear el curso' }, { status: 500 });
  }
}

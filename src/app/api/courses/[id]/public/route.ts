import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id: Number(id) },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { accessProfiles: { include: { profile: true } } },
      },
      prices: { where: { active: true }, include: { profile: true } },
      courseProfiles: { include: { profile: true } },
    },
  });
  if (!course) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(course);
}

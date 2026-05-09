import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const modules = await prisma.module.findMany({
      where: { courseId: Number(id) },
      orderBy: { order: 'asc' },
      include: { accessProfiles: { include: { profile: true } } },
    });
    return NextResponse.json(modules);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const body = await req.json();
    const last = await prisma.module.findFirst({
      where: { courseId: Number(id) },
      orderBy: { order: 'desc' },
    });
    const module = await prisma.module.create({
      data: {
        courseId: Number(id),
        name: body.name ?? 'Nuevo Módulo',
        date: body.date ?? '',
        order: (last?.order ?? 0) + 1,
      },
      include: { accessProfiles: { include: { profile: true } } },
    });
    return NextResponse.json(module, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al crear módulo' }, { status: 500 });
  }
}

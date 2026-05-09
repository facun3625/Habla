import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await prisma.courseProfile.findMany({
    where: { courseId: Number(id) },
    include: { profile: true },
    orderBy: { profile: { name: 'asc' } },
  });
  return NextResponse.json(access);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { profileId, capacity } = await req.json();
  try {
    const cp = await prisma.courseProfile.create({
      data: { courseId: Number(id), profileId: Number(profileId), capacity: Number(capacity) || 0 },
      include: { profile: true },
    });
    return NextResponse.json(cp, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Este perfil ya está configurado para el curso' }, { status: 409 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { profileId, capacity, requireCredential } = await req.json();
  const data: { capacity?: number; requireCredential?: boolean } = {};
  if (capacity !== undefined) data.capacity = Number(capacity) || 0;
  if (requireCredential !== undefined) data.requireCredential = Boolean(requireCredential);
  const cp = await prisma.courseProfile.update({
    where: { courseId_profileId: { courseId: Number(id), profileId: Number(profileId) } },
    data,
    include: { profile: true },
  });
  return NextResponse.json(cp);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { profileId } = await req.json();
  await prisma.courseProfile.delete({
    where: { courseId_profileId: { courseId: Number(id), profileId: Number(profileId) } },
  });
  return NextResponse.json({ ok: true });
}

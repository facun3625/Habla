import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { role, profileId } = body;

  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (profileId !== undefined) data.profileId = profileId === '' || profileId === null ? null : Number(profileId);

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: { id: true, role: true, profileId: true, profile: { select: { id: true, name: true } } },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}

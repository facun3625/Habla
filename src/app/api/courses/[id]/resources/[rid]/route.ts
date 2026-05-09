import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; rid: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { rid } = await params;
  const body = await req.json();
  const resource = await prisma.courseResource.update({
    where: { id: parseInt(rid) },
    data: body,
  });
  return NextResponse.json(resource);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; rid: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { rid } = await params;
  await prisma.courseResource.delete({ where: { id: parseInt(rid) } });
  return NextResponse.json({ ok: true });
}

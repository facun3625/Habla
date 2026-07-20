import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    return user?.role === 'ADMIN' ? user : null;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { role, profileId, name, email } = body;

  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (profileId !== undefined) data.profileId = profileId === '' || profileId === null ? null : Number(profileId);
  if (name !== undefined) data.name = typeof name === 'string' ? name.trim() || null : null;
  if (email !== undefined) {
    const clean = String(email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return NextResponse.json({ error: 'El email no es válido' }, { status: 400 });
    }
    data.email = clean;
  }

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data,
      select: { id: true, name: true, email: true, role: true, profileId: true, profile: { select: { id: true, name: true } } },
    });
    return NextResponse.json(user);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al actualizar el usuario' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}

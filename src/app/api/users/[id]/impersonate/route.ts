import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, signToken, COOKIE, IMPERSONATOR_COOKIE } from '@/lib/auth';

type P = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: P) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let adminPayload;
  try {
    adminPayload = await verifyToken(token);
    const admin = await prisma.user.findUnique({ where: { id: adminPayload.userId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const targetId = Number(id);
  if (targetId === adminPayload.userId) {
    return NextResponse.json({ error: 'Ya sos ese usuario' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const impersonatedToken = await signToken({ userId: target.id, email: target.email, name: target.name });

  const res = NextResponse.json({ ok: true, name: target.name, email: target.email });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  // Preserve the admin's own session so they can return to it later
  res.cookies.set(IMPERSONATOR_COOKIE, token, { ...cookieOpts, maxAge: 60 * 60 * 24 });
  res.cookies.set(COOKIE, impersonatedToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

  return res;
}

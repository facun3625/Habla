import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE, IMPERSONATOR_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const adminToken = req.cookies.get(IMPERSONATOR_COOKIE)?.value;
  if (!adminToken) return NextResponse.json({ error: 'No hay sesión de administrador para restaurar' }, { status: 400 });

  try {
    await verifyToken(adminToken);
  } catch {
    const res = NextResponse.json({ error: 'La sesión de administrador expiró' }, { status: 401 });
    res.cookies.delete(IMPERSONATOR_COOKIE);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.delete(IMPERSONATOR_COOKIE);
  return res;
}

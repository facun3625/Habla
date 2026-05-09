import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, rememberMe } = await req.json();
  const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

  let userId = 0;
  let name = 'Administrador';

  // Intentar con la base de datos primero
  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.password) {
        return NextResponse.json({ error: 'Esta cuenta usa Google para iniciar sesión.' }, { status: 401 });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
      }
      userId = user.id;
      name = user.name ?? 'Administrador';
    } else {
      return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
    }
  } catch {
    // Sin DB: verificar contra variables de entorno
    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envEmail || !envPassword) {
      return NextResponse.json({ error: 'Sin base de datos configurada.' }, { status: 503 });
    }

    if (email !== envEmail || password !== envPassword) {
      return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
    }
  }

  const token = await signToken({ userId, email, name });

  const res = NextResponse.json({ ok: true, name, email });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: cookieMaxAge,
  });

  return res;
}

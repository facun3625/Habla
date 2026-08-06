import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let userId: number;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { phone } = await req.json();
  if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
    return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { phone: phone.trim() },
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

type P = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const { status, notes } = await req.json();
  const installment = await prisma.installment.update({
    where: { id: Number(id) },
    data: { status, notes: notes ?? undefined, reviewedAt: new Date() },
  });

  return NextResponse.json(installment);
}

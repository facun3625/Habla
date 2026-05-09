import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = parseInt(id);

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let userId: number;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId, userId, status: 'CONFIRMADA' },
  });
  if (!enrollment) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });

  const resources = await prisma.courseResource.findMany({
    where: { courseId, visible: true },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(resources);
}

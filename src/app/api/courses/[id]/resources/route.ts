import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    return user?.role === 'ADMIN' ? payload : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  const resources = await prisma.courseResource.findMany({
    where: { courseId: parseInt(id) },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(resources);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  const courseId = parseInt(id);
  const body = await req.json();

  const last = await prisma.courseResource.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
  });

  const resource = await prisma.courseResource.create({
    data: {
      courseId,
      type: body.type,
      title: body.title,
      fileUrl: body.fileUrl ?? null,
      visible: false,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json(resource, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { driveFileId } from '@/lib/googleDrive';

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
  const videos = await prisma.courseVideo.findMany({
    where: { courseId: parseInt(id) },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  const courseId = parseInt(id);
  const body = await req.json();

  const title = (body.title ?? '').trim();
  const driveUrl = (body.driveUrl ?? '').trim();
  if (!title || !driveUrl) {
    return NextResponse.json({ error: 'Título y link son requeridos.' }, { status: 400 });
  }
  if (!driveFileId(driveUrl)) {
    return NextResponse.json({ error: 'Pegá un link para compartir de Google Drive válido.' }, { status: 400 });
  }

  const last = await prisma.courseVideo.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
  });

  const video = await prisma.courseVideo.create({
    data: {
      courseId,
      title,
      driveUrl,
      // Nace oculto hasta que la admin lo revise y publique, igual que los materiales del repositorio.
      visible: false,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json(video, { status: 201 });
}

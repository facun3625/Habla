import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { driveFileId } from '@/lib/googleDrive';

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; vid: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { vid } = await params;
  const body = await req.json();

  if (typeof body.driveUrl === 'string' && !driveFileId(body.driveUrl)) {
    return NextResponse.json({ error: 'Pegá un link para compartir de Google Drive válido.' }, { status: 400 });
  }

  const video = await prisma.courseVideo.update({
    where: { id: parseInt(vid) },
    data: body,
  });
  return NextResponse.json(video);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; vid: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { vid } = await params;
  await prisma.courseVideo.delete({ where: { id: parseInt(vid) } });
  return NextResponse.json({ ok: true });
}

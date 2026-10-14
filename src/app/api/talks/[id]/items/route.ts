import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { driveEmbedUrl } from '@/lib/googleDrive';

const TYPES = new Set(['FILE', 'VIDEO', 'BIBLIOGRAPHY']);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const talkPageId = Number(id);
  const body = await req.json();
  const type = typeof body.type === 'string' ? body.type : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const url = typeof body.url === 'string' ? body.url.trim() : '';

  if (!TYPES.has(type) || !title) {
    return NextResponse.json({ error: 'Tipo o título inválido.' }, { status: 400 });
  }
  if (type === 'FILE' && !url) {
    return NextResponse.json({ error: 'Tenés que subir un PDF.' }, { status: 400 });
  }
  if (type === 'VIDEO' && (!url || !driveEmbedUrl(url))) {
    return NextResponse.json({ error: 'Ingresá un enlace válido de un archivo de Google Drive.' }, { status: 400 });
  }

  const last = await prisma.talkItem.findFirst({
    where: { talkPageId, type },
    orderBy: { order: 'desc' },
  });
  const item = await prisma.talkItem.create({
    data: {
      talkPageId,
      type,
      title,
      url: url || null,
      order: (last?.order ?? -1) + 1,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

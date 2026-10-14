import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

const MAX_SIZE = 25 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const talkPageId = Number(id);
  if (!Number.isInteger(talkPageId)) {
    return NextResponse.json({ error: 'Charla inválida.' }, { status: 400 });
  }

  const talkExists = await prisma.talkPage.count({ where: { id: talkPageId } });
  if (!talkExists) return NextResponse.json({ error: 'Charla no encontrada.' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Solo se permiten archivos PDF.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'El PDF no puede superar los 25 MB.' }, { status: 400 });
  }

  const directory = join(process.cwd(), 'public', 'uploads', 'charlas', String(talkPageId));
  await mkdir(directory, { recursive: true });
  const safeName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+/, '');
  const filename = `${Date.now()}-${safeName || 'archivo.pdf'}`;
  await writeFile(join(directory, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/charlas/${talkPageId}/${filename}` });
}

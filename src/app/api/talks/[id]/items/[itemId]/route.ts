import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id, itemId } = await params;
  const body = await req.json();
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 });

  const result = await prisma.talkItem.updateMany({
    where: { id: Number(itemId), talkPageId: Number(id) },
    data: { title },
  });
  if (!result.count) return NextResponse.json({ error: 'Elemento no encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id, itemId } = await params;
  const result = await prisma.talkItem.deleteMany({
    where: { id: Number(itemId), talkPageId: Number(id) },
  });
  if (!result.count) return NextResponse.json({ error: 'Elemento no encontrado.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

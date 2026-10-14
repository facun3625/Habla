import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { slugifyTalkTitle, talkPublicPath } from '@/lib/talkPages';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const talk = await prisma.talkPage.findUnique({
    where: { id: Number(id) },
    include: { items: { orderBy: [{ type: 'asc' }, { order: 'asc' }] } },
  });
  if (!talk) return NextResponse.json({ error: 'Charla no encontrada' }, { status: 404 });

  return NextResponse.json({
    ...talk,
    publicPath: talkPublicPath(talk.slug, talk.accessToken),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: { title?: string; slug?: string; active?: boolean } = {};

  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 });
    data.title = title;
    data.slug = slugifyTalkTitle(title);
  }
  if (typeof body.active === 'boolean') data.active = body.active;

  const talk = await prisma.talkPage.update({ where: { id: Number(id) }, data });
  return NextResponse.json({
    ...talk,
    publicPath: talkPublicPath(talk.slug, talk.accessToken),
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== 'ELIMINAR') {
    return NextResponse.json({ error: 'Confirmación requerida.' }, { status: 400 });
  }

  await prisma.talkPage.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}

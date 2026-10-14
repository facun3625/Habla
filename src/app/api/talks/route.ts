import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { newTalkToken, slugifyTalkTitle, talkPublicPath } from '@/lib/talkPages';

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const talks = await prisma.talkPage.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json(talks.map((talk) => ({
    ...talk,
    publicPath: talkPublicPath(talk.slug, talk.accessToken),
  })));
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await req.json();
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 });
  }

  const talk = await prisma.talkPage.create({
    data: {
      title,
      slug: slugifyTalkTitle(title),
      accessToken: newTalkToken(),
    },
  });

  return NextResponse.json({
    ...talk,
    publicPath: talkPublicPath(talk.slug, talk.accessToken),
  }, { status: 201 });
}

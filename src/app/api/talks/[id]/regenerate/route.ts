import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { newTalkToken, talkPublicPath } from '@/lib/talkPages';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const talk = await prisma.talkPage.update({
    where: { id: Number(id) },
    data: { accessToken: newTalkToken() },
  });

  return NextResponse.json({
    ...talk,
    publicPath: talkPublicPath(talk.slug, talk.accessToken),
  });
}

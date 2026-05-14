import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const items: { id: number; order: number }[] = await request.json();
    await prisma.$transaction(
      items.map(({ id, order }) =>
        prisma.post.update({ where: { id }, data: { order } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error reordering posts:', error);
    return NextResponse.json({ error: 'Error reordering posts' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

function cleanTopic(s: string): string {
  return s
    .replace(/​/g, '').replace(/&#8203;/g, '')
    .replace(/­/g, '').replace(/&#173;/g, '').replace(/&shy;/g, '')
    .replace(/﻿/g, '').replace(/‌/g, '').replace(/‍/g, '')
    .replace(/<wbr\s*\/?>/gi, '');
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id: Number(id) },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { accessProfiles: { include: { profile: true } } },
      },
      resources: {
        where: { visible: true },
        orderBy: { order: 'asc' }
      },
      prices: { where: { active: true }, include: { profile: true } },
      courseProfiles: { include: { profile: true } },
    },
  });
  if (!course) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const cleaned = {
    ...course,
    modules: course.modules.map(m => ({ ...m, topics: m.topics.map(cleanTopic) })),
  };
  return NextResponse.json(cleaned);
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      profession: true,
      createdAt: true,
      profile: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(users);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const { id } = await params;
  const courseProfiles = await prisma.courseProfile.findMany({
    where: { courseId: Number(id) },
    include: { profile: true },
    orderBy: { profileId: 'asc' },
  });
  return NextResponse.json(courseProfiles);
}

export async function PUT(req: NextRequest, { params }: P) {
  const { id } = await params;
  const body: { profileId: number; installmentsEnabled: boolean; maxInstallments: number }[] = await req.json();

  await Promise.all(
    body.map(({ profileId, installmentsEnabled, maxInstallments }) =>
      prisma.courseProfile.update({
        where: { courseId_profileId: { courseId: Number(id), profileId } },
        data: { installmentsEnabled, maxInstallments },
      })
    )
  );

  return NextResponse.json({ ok: true });
}

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
      birthDate: true, dni: true, city: true,
      hasApraxiaExperience: true, apraxiaExperienceDetail: true,
      hasOtherTraining: true, otherTrainingDetail: true,
      specificMethod: true, questionnaireCompleted: true,
    },
  });

  return NextResponse.json(users);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

type P = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: P) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json(null);

  let userId: number;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json(null);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId: Number(id), userId },
    include: {
      installmentPlan: {
        include: { installments: { orderBy: { number: 'asc' } } },
      },
    },
  });

  if (!enrollment?.installmentPlan) return NextResponse.json(null);
  return NextResponse.json(enrollment.installmentPlan);
}

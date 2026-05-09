import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    return user?.role === 'ADMIN' ? payload : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: {
        status: 'COMPROBANTE_SUBIDO'
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by course
    const summary = pendingEnrollments.reduce((acc: any, curr) => {
      const courseId = curr.courseId;
      if (!acc[courseId]) {
        acc[courseId] = {
          courseId: courseId,
          courseTitle: curr.course.title,
          count: 0
        };
      }
      acc[courseId].count++;
      return acc;
    }, {});

    return NextResponse.json({
      total: pendingEnrollments.length,
      details: Object.values(summary)
    });
  } catch (error) {
    console.error('Error fetching pending enrollments:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

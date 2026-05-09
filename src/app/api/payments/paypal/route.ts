import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPayPalOrder } from '@/lib/paypal';
import { verifyToken, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let payload;
  try { payload = await verifyToken(token); }
  catch { return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 }); }

  const { enrollmentId } = await req.json();
  if (!enrollmentId) return NextResponse.json({ error: 'enrollmentId requerido' }, { status: 400 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: Number(enrollmentId) },
    include: { course: true },
  });
  if (!enrollment) return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 });
  if (enrollment.userId !== payload.userId) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const price = await prisma.price.findFirst({
    where: { courseId: enrollment.courseId, profileId: enrollment.profileId, active: true },
  }) ?? await prisma.price.findFirst({
    where: { courseId: enrollment.courseId, profileId: null, active: true },
  });

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  try {
    const order = await createPayPalOrder({
      amount: price?.amount ?? 0,
      currency: price?.currency === 'ARS' ? 'USD' : (price?.currency ?? 'USD'),
      description: enrollment.course.title,
      enrollmentId: enrollment.id,
      returnUrl: `${base}/api/payments/paypal/capture?enrollmentId=${enrollment.id}`,
      cancelUrl: `${base}/cursos/${enrollment.courseId}?pago=cancelado`,
    });

    const approveLink = order.links?.find((l: { rel: string }) => l.rel === 'approve')?.href;
    if (!approveLink) return NextResponse.json({ error: 'Error al crear orden PayPal' }, { status: 500 });

    // Save PayPal order ID for capture
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { paymentRef: order.id },
    });

    return NextResponse.json({ checkoutUrl: approveLink });
  } catch (e) {
    console.error('PayPal create order error:', e);
    return NextResponse.json({ error: 'PayPal no configurado o error al crear orden' }, { status: 503 });
  }
}

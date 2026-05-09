import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { capturePayPalOrder } from '@/lib/paypal';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token'); // PayPal order ID
  const enrollmentId = searchParams.get('enrollmentId');
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  if (!token || !enrollmentId) {
    return NextResponse.redirect(`${base}/?pago=error`);
  }

  try {
    const capture = await capturePayPalOrder(token);

    if (capture.status === 'COMPLETED') {
      const enrollment = await prisma.enrollment.update({
        where: { id: Number(enrollmentId) },
        data: {
          status: 'CONFIRMADA',
          paymentRef: token,
          paidAt: new Date(),
        },
      });
      return NextResponse.redirect(`${base}/cursos/${enrollment.courseId}?pago=ok`);
    } else {
      return NextResponse.redirect(`${base}/?pago=error`);
    }
  } catch (e) {
    console.error('PayPal capture error:', e);
    return NextResponse.redirect(`${base}/?pago=error`);
  }
}

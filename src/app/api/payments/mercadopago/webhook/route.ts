import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import MercadoPago, { Payment } from 'mercadopago';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // MP sends different notification types
  const type = body.type ?? body.topic;
  const id = body.data?.id ?? body.id;

  if (type !== 'payment' || !id) return NextResponse.json({ ok: true });

  const accessToken = await getSetting('mp_access_token');
  if (!accessToken) return NextResponse.json({ ok: true });

  try {
    const client = new MercadoPago({ accessToken });
    const payment = new Payment(client);
    const data = await payment.get({ id: String(id) });

    const enrollmentId = Number(data.external_reference);
    if (!enrollmentId) return NextResponse.json({ ok: true });

    if (data.status === 'approved') {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'CONFIRMADA',
          paymentRef: String(id),
          paidAt: new Date(),
        },
      });
    } else if (data.status === 'rejected' || data.status === 'cancelled') {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'CANCELADA' },
      });
    }
  } catch (e) {
    console.error('MP webhook error:', e);
  }

  return NextResponse.json({ ok: true });
}

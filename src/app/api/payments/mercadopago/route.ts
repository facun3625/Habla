import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { verifyToken, COOKIE } from '@/lib/auth';
import MercadoPago, { Preference } from 'mercadopago';

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
    include: { course: true, profile: true },
  });
  if (!enrollment) return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 });
  if (enrollment.userId !== payload.userId) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const cfg = await getSettings(['mp_access_token', 'mp_mode']);
  if (!cfg.mp_access_token) return NextResponse.json({ error: 'Mercado Pago no configurado' }, { status: 503 });

  // Get price for this enrollment's profile
  const price = await prisma.price.findFirst({
    where: { courseId: enrollment.courseId, profileId: enrollment.profileId, active: true },
  }) ?? await prisma.price.findFirst({
    where: { courseId: enrollment.courseId, profileId: null, active: true },
  });

  const amount = price?.amount ?? 0;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  const client = new MercadoPago({ accessToken: cfg.mp_access_token });
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [{
        id: String(enrollment.courseId),
        title: enrollment.course.title,
        quantity: 1,
        unit_price: amount,
        currency_id: price?.currency ?? 'ARS',
      }],
      payer: { email: enrollment.email },
      external_reference: String(enrollment.id),
      back_urls: {
        success: `${base}/cursos/${enrollment.courseId}?pago=ok`,
        failure: `${base}/cursos/${enrollment.courseId}?pago=error`,
        pending: `${base}/cursos/${enrollment.courseId}?pago=pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${base}/api/payments/mercadopago/webhook`,
    },
  });

  const checkoutUrl = cfg.mp_mode === 'sandbox'
    ? result.sandbox_init_point
    : result.init_point;

  return NextResponse.json({ checkoutUrl });
}

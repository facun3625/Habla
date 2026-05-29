import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

type P = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: P) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const installment = await prisma.installment.findUnique({
    where: { id: Number(id) },
    include: {
      plan: {
        include: {
          enrollment: {
            include: { course: { select: { title: true } } },
          },
        },
      },
    },
  });

  if (!installment) return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 });

  const { plan } = installment;
  const { enrollment } = plan;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const dueStr = installment.dueDate
    ? new Date(installment.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const body = `
    <p>Hola <strong>${enrollment.userName}</strong>,</p>
    <p>Te recordamos que tu <strong>cuota ${installment.number} de ${plan.numInstallments}</strong> por <strong>${installment.amount.toLocaleString('es-AR')} ${plan.currency}</strong> del curso <strong>${enrollment.course.title}</strong>${dueStr ? ` venció el <strong>${dueStr}</strong>` : ' está pendiente de pago'}.</p>
    <p>Para no perder tu lugar, por favor realizá el pago y subí el comprobante desde tu panel de alumna.</p>
    <p>Ante cualquier consulta respondé este email.<br/>Equipo Hablapraxia</p>
  `;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);padding:28px 32px;text-align:center;">
        <img src="${baseUrl}/logo.png" alt="Hablapraxia" style="height:48px;object-fit:contain;" />
      </div>
      <div style="padding:32px;color:#2c3e50;line-height:1.7;">${body}</div>
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:0.8rem;color:#94a3b8;border-top:1px solid #e2e8f0;">
        © ${new Date().getFullYear()} Hablapraxia · <a href="${baseUrl}" style="color:#6c5ce7;text-decoration:none;">hablapraxia.com.ar</a>
      </div>
    </div>`;

  try {
    await sendMail({
      to: enrollment.email,
      subject: `Recordatorio: cuota ${installment.number}/${plan.numInstallments} pendiente — ${enrollment.course.title}`,
      html,
      type: 'TRANSACTIONAL',
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Error sending reminder:', e);
    return NextResponse.json({ error: 'Error al enviar el recordatorio' }, { status: 500 });
  }
}

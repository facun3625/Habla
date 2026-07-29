import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

type P = { params: Promise<{ id: string }> };

function emailHtml(body: string, baseUrl: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);padding:28px 32px;text-align:center;">
        <img src="${baseUrl}/logo.png" alt="Hablapraxia" style="height:48px;object-fit:contain;" />
      </div>
      <div style="padding:32px;color:#2c3e50;line-height:1.7;">${body}</div>
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:0.8rem;color:#94a3b8;border-top:1px solid #e2e8f0;">
        © ${new Date().getFullYear()} Hablapraxia · <a href="${baseUrl}" style="color:#6c5ce7;text-decoration:none;">hablapraxia.com.ar</a>
      </div>
    </div>`;
}

export async function PATCH(req: NextRequest, { params }: P) {
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

  const { status, notes } = await req.json();

  const installment = await prisma.installment.update({
    where: { id: Number(id) },
    data: { status, notes: notes ?? undefined, reviewedAt: new Date() },
    include: {
      plan: {
        include: {
          installments: { orderBy: { number: 'asc' } },
          enrollment: {
            include: {
              course: { select: { id: true, title: true, startDate: true, confirmationEmail: true, confirmationEmailSubject: true } },
            },
          },
        },
      },
    },
  });

  if (status === 'ACCEPTED') {
    const { plan } = installment;
    const { enrollment } = plan;
    const wasConfirmed = enrollment.status === 'CONFIRMADA';

    // Auto-confirm enrollment if not already confirmed
    if (!wasConfirmed) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: 'CONFIRMADA', paidAt: new Date() },
      });
    }

    // El envío de mail no debe bloquear la respuesta: se dispara en segundo plano
    // después de responder, para que "Acreditar" sea instantáneo aunque el SMTP esté lento o caído.
    after(async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      // Find next pending installment
      const nextInst = plan.installments.find(i => i.number === installment.number + 1);
      const isLast = !nextInst;
      const allAccepted = plan.installments.every(i => i.id === installment.id ? true : i.status === 'ACCEPTED');

      // Build email body
      let body = `<p>Hola <strong>${enrollment.userName}</strong>,</p>`;
      body += `<p>Acreditamos tu <strong>cuota ${installment.number} de ${plan.numInstallments}</strong> por ${installment.amount.toLocaleString('es-AR')} ${plan.currency} para el curso <strong>${enrollment.course.title}</strong>.</p>`;

      if (!wasConfirmed) {
        body += `<p>Tu inscripción está <strong>confirmada</strong>. ¡Ya tenés acceso al curso!</p>`;
      }

      if (!isLast && nextInst) {
        const dueStr = nextInst.dueDate
          ? new Date(nextInst.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
          : null;
        body += `<p>Tu próxima cuota es la <strong>#${nextInst.number}</strong> por <strong>${nextInst.amount.toLocaleString('es-AR')} ${plan.currency}</strong>`;
        if (dueStr) body += `, con vencimiento el <strong>${dueStr}</strong>`;
        body += `.</p>`;
      } else if (allAccepted) {
        body += `<p>🎉 <strong>¡Completaste el pago total de tu inscripción!</strong></p>`;
      }

      body += `<p>Ante cualquier consulta respondé este email.<br/>Equipo Hablapraxia</p>`;

      try {
        await sendMail({
          to: enrollment.email,
          subject: `Cuota ${installment.number}/${plan.numInstallments} acreditada — ${enrollment.course.title}`,
          html: emailHtml(body, baseUrl),
          type: 'TRANSACTIONAL',
        });
      } catch (e) {
        console.error('Error sending installment email:', e);
      }
    });
  }

  return NextResponse.json(installment);
}

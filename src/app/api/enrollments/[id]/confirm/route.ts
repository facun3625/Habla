import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

type P = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: P) {
  const { id } = await params;
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: Number(id) },
      data: { status: 'CONFIRMADA', paidAt: new Date() },
      include: {
        course: { select: { title: true, startDate: true, confirmationEmail: true, confirmationEmailSubject: true } },
        profile: { select: { name: true } },
      },
    });

    // Send confirmation email if template is configured
    const template = enrollment.course.confirmationEmail;
    if (template && enrollment.email) {
      const startDate = enrollment.course.startDate
        ? new Date(enrollment.course.startDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

      const bodyContent = template
        .replace(/\{nombre\}/g, enrollment.userName || 'Estudiante')
        .replace(/\{curso\}/g, enrollment.course.title)
        .replace(/\{fecha_inicio\}/g, startDate)
        .replace(/\{perfil\}/g, enrollment.profile?.name || '');

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);padding:28px 32px;text-align:center;">
            <img src="${baseUrl}/logo.png" alt="Hablapraxia" style="height:48px;object-fit:contain;" />
          </div>
          <div style="padding:32px;color:#2c3e50;line-height:1.7;">
            ${bodyContent}
          </div>
          <div style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:0.8rem;color:#94a3b8;border-top:1px solid #e2e8f0;">
            © ${new Date().getFullYear()} Hablapraxia · <a href="${baseUrl}" style="color:#6c5ce7;text-decoration:none;">hablapraxia.com.ar</a>
          </div>
        </div>
      `;

      const subject = (enrollment.course.confirmationEmailSubject || 'Tu inscripción fue confirmada')
        .replace(/\{curso\}/g, enrollment.course.title);

      try {
        await sendMail({ to: enrollment.email, subject, html });
      } catch (mailErr) {
        console.error('Error sending confirmation email:', mailErr);
        // Don't fail the confirmation if email fails
      }
    }

    return NextResponse.json(enrollment);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al confirmar inscripción' }, { status: 500 });
  }
}

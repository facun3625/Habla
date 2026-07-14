import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

type P = { params: Promise<{ id: string }> };

const DEFAULT_TEMPLATE = `<p>Hola {nombre},</p>
<p>Tu inscripción en el curso <strong>{curso}</strong> ha sido <strong>confirmada</strong>.</p>
<p>Fecha de inicio: {fecha_inicio}</p>
<p>¡Te esperamos! Ante cualquier consulta respondé este email.</p>
<p>Equipo Hablapraxia</p>`;

export async function POST(req: NextRequest, { params }: P) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const admin = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const { extraEmail } = await req.json().catch(() => ({ extraEmail: undefined }));

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: Number(id) },
    include: {
      course: { select: { title: true, startDate: true, confirmationEmail: true, confirmationEmailSubject: true } },
      profile: { select: { name: true } },
    },
  });
  if (!enrollment) return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 });
  if (enrollment.status !== 'CONFIRMADA') {
    return NextResponse.json({ error: 'La inscripción todavía no está confirmada' }, { status: 400 });
  }
  if (!enrollment.email) return NextResponse.json({ error: 'La inscripción no tiene email' }, { status: 400 });

  const recipients = [enrollment.email];
  if (extraEmail && typeof extraEmail === 'string' && extraEmail.trim()) {
    const clean = extraEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return NextResponse.json({ error: 'El email adicional no es válido' }, { status: 400 });
    }
    if (!recipients.includes(clean)) recipients.push(clean);
  }

  const template = enrollment.course.confirmationEmail || DEFAULT_TEMPLATE;
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
    await sendMail({ to: recipients, subject, html, type: 'TRANSACTIONAL' });
    return NextResponse.json({ ok: true, sentTo: recipients });
  } catch (e) {
    console.error('Error resending confirmation email:', e);
    return NextResponse.json({ error: 'Error al reenviar el mail' }, { status: 500 });
  }
}

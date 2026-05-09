import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBulk } from '@/lib/mailer';

type RecipientType = 'all' | 'course' | 'custom';

export async function POST(req: NextRequest) {
  const { recipientType, courseId, customEmails, subject, html } = await req.json() as {
    recipientType: RecipientType;
    courseId?: number;
    customEmails?: string;
    subject: string;
    html: string;
  };

  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: 'Asunto y contenido son requeridos.' }, { status: 400 });
  }

  let emails: string[] = [];

  if (recipientType === 'all') {
    const users = await prisma.user.findMany({ select: { email: true } });
    emails = users.map((u) => u.email);
  } else if (recipientType === 'course') {
    if (!courseId) return NextResponse.json({ error: 'Seleccioná un curso.' }, { status: 400 });
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: Number(courseId), status: { in: ['CONFIRMADA', 'COMPROBANTE_SUBIDO'] } },
      select: { email: true },
    });
    emails = [...new Set(enrollments.map((e) => e.email).filter(Boolean))];
  } else if (recipientType === 'custom') {
    if (!customEmails?.trim()) return NextResponse.json({ error: 'Pegá al menos un email.' }, { status: 400 });
    emails = customEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    emails = [...new Set(emails)];
  }

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No se encontraron destinatarios válidos.' }, { status: 400 });
  }

  const { sent, failed } = await sendBulk(emails, subject, html);
  return NextResponse.json({ sent, failed, total: emails.length });
}

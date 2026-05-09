import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requerido.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return OK to avoid email enumeration
    if (!user) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: 'Recuperar contraseña — Hablapraxia',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:40px 20px">
          <h2 style="color:#6c5ce7">Recuperar contraseña</h2>
          <p>Recibiste este email porque solicitaste restablecer tu contraseña.</p>
          <p>Hacé clic en el botón para crear una nueva contraseña. El link es válido por 1 hora.</p>
          <a href="${resetUrl}" style="display:inline-block;margin-top:20px;padding:14px 28px;background:#6c5ce7;color:white;border-radius:12px;text-decoration:none;font-weight:700">
            Restablecer contraseña
          </a>
          <p style="margin-top:24px;color:#999;font-size:13px">Si no solicitaste esto, ignorá este email.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Error al enviar el email.' }, { status: 500 });
  }
}

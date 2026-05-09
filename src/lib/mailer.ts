import nodemailer from 'nodemailer';
import { prisma } from './prisma';

async function getSmtpConfig() {
  const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name'];
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    host: cfg.smtp_host || process.env.SMTP_HOST || '',
    port: Number(cfg.smtp_port || process.env.SMTP_PORT || 587),
    secure: (cfg.smtp_secure ?? 'false') === 'true',
    user: cfg.smtp_user || process.env.SMTP_USER || '',
    pass: cfg.smtp_pass || process.env.SMTP_PASS || '',
    fromEmail: cfg.smtp_from_email || process.env.SMTP_FROM || '',
    fromName: cfg.smtp_from_name || 'Hablapraxia',
  };
}

export async function sendMail({ to, subject, html }: { to: string | string[]; subject: string; html: string }) {
  const cfg = await getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  const from = cfg.fromName ? `"${cfg.fromName}" <${cfg.fromEmail}>` : cfg.fromEmail;
  return transporter.sendMail({ from, to, subject, html });
}

export async function sendBulk(
  emails: string[],
  subject: string,
  html: string,
  onProgress?: (sent: number, total: number) => void
): Promise<{ sent: number; failed: number }> {
  const cfg = await getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    pool: true,
    maxConnections: 3,
  });
  const from = cfg.fromName ? `"${cfg.fromName}" <${cfg.fromEmail}>` : cfg.fromEmail;

  let sent = 0;
  let failed = 0;
  for (const email of emails) {
    try {
      await transporter.sendMail({ from, to: email, subject, html });
      sent++;
    } catch {
      failed++;
    }
    onProgress?.(sent + failed, emails.length);
    // Small delay to be polite to the SMTP server
    await new Promise((r) => setTimeout(r, 100));
  }
  transporter.close();
  return { sent, failed };
}

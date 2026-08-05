import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

type Params = { params: Promise<{ id: string; templateId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { templateId } = await params;
  const body = await req.json();

  const data: Record<string, string | null> = {};
  if (typeof body.title === 'string') data.title = body.title.trim();
  if (typeof body.subtitle === 'string') data.subtitle = body.subtitle.trim() || null;
  if (typeof body.bodyTemplate === 'string') data.bodyTemplate = body.bodyTemplate.trim();

  const template = await prisma.certificateTemplate.update({
    where: { id: parseInt(templateId) },
    data,
    include: { module: { select: { id: true, name: true } } },
  });
  return NextResponse.json(template);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { templateId } = await params;
  await prisma.certificateTemplate.delete({ where: { id: parseInt(templateId) } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    return user?.role === 'ADMIN' ? payload : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  const templates = await prisma.certificateTemplate.findMany({
    where: { courseId: parseInt(id) },
    include: { module: { select: { id: true, name: true } } },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;
  const courseId = parseInt(id);
  const body = await req.json();

  const title = (body.title ?? '').trim();
  const bodyTemplate = (body.bodyTemplate ?? '').trim();
  const moduleId = body.moduleId ? Number(body.moduleId) : null;
  if (!title || !bodyTemplate) {
    return NextResponse.json({ error: 'Título y cuerpo son requeridos.' }, { status: 400 });
  }

  // Postgres no considera duplicados dos NULL en un @@unique, así que el caso
  // "curso completo" (moduleId null) se valida acá a mano.
  if (moduleId === null) {
    const existing = await prisma.certificateTemplate.findFirst({ where: { courseId, moduleId: null } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una plantilla de curso completo para este curso.' }, { status: 409 });
    }
  }

  try {
    const template = await prisma.certificateTemplate.create({
      data: {
        courseId,
        moduleId,
        title,
        subtitle: body.subtitle?.trim() || null,
        bodyTemplate,
      },
      include: { module: { select: { id: true, name: true } } },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una plantilla para ese módulo.' }, { status: 409 });
    }
    console.error('POST /api/courses/[id]/certificate', e);
    return NextResponse.json({ error: 'Error al crear la plantilla' }, { status: 500 });
  }
}

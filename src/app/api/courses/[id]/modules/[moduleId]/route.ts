import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';

type P = { params: Promise<{ id: string; moduleId: string }> };

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

export async function PUT(req: NextRequest, { params }: P) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  try {
    const { id: courseId, moduleId } = await params;
    const body = await req.json();

    // Update base fields
    await prisma.module.update({
      where: { id: Number(moduleId) },
      data: {
        name: body.name,
        date: body.date,
        accessAll: body.accessAll ?? true,
        topics: Array.isArray(body.topics) ? body.topics.filter((t: string) => t.trim()) : [],
        connectionLink: body.connectionLink ?? null,
        connectionInfo: body.connectionInfo ?? null,
      },
    });

    // Update profile access if provided
    if (body.accessAll === false && Array.isArray(body.profileIds)) {
      await prisma.moduleAccess.deleteMany({ where: { moduleId: Number(moduleId) } });
      if (body.profileIds.length > 0) {
        await prisma.moduleAccess.createMany({
          data: body.profileIds.map((pid: number) => ({ moduleId: Number(moduleId), profileId: pid })),
        });
      }
    } else if (body.accessAll === true) {
      await prisma.moduleAccess.deleteMany({ where: { moduleId: Number(moduleId) } });
    }

    const updated = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      include: { accessProfiles: { include: { profile: true } } },
    });
    void courseId;
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar módulo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  try {
    const { moduleId } = await params;
    await prisma.module.delete({ where: { id: Number(moduleId) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar módulo' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type P = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  const { id } = await params;
  const body = await req.json();
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: Number(id) },
      data: {
        status: body.status,
        notes: body.notes,
        paidAt: body.status === 'CONFIRMADA' ? new Date() : undefined,
        certificateEnabled: typeof body.certificateEnabled === 'boolean' ? body.certificateEnabled : undefined,
        // Si el campo viene en el body (aunque sea null, para volver a "Automático"), lo actualizamos;
        // si no viene, no lo tocamos.
        certificateTemplateId: 'certificateTemplateId' in body
          ? (body.certificateTemplateId ? Number(body.certificateTemplateId) : null)
          : undefined,
      },
      include: { profile: true },
    });
    return NextResponse.json(enrollment);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar inscripción' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id } = await params;
  try {
    await prisma.enrollment.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar inscripción' }, { status: 500 });
  }
}

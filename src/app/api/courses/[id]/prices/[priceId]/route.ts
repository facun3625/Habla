import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type P = { params: Promise<{ priceId: string }> };

export async function PUT(req: NextRequest, { params }: P) {
  try {
    const { priceId } = await params;
    const body = await req.json();
    const price = await prisma.price.update({
      where: { id: Number(priceId) },
      data: {
        name: body.name,
        amount: Number(body.amount),
        currency: body.currency,
        active: body.active,
        profileId: body.profileId ? Number(body.profileId) : null,
      },
      include: { profile: true },
    });
    return NextResponse.json(price);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar precio' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: P) {
  try {
    const { priceId } = await params;
    await prisma.price.delete({ where: { id: Number(priceId) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar precio' }, { status: 500 });
  }
}

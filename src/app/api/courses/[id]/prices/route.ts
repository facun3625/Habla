import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const prices = await prisma.price.findMany({
      where: { courseId: Number(id) },
      include: { profile: true },
    });
    return NextResponse.json(prices);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const body = await req.json();
    const price = await prisma.price.create({
      data: {
        courseId: Number(id),
        name: body.name ?? 'Nuevo Precio',
        amount: Number(body.amount) || 0,
        currency: body.currency ?? 'ARS',
        active: body.active ?? true,
        profileId: body.profileId ? Number(body.profileId) : null,
      },
      include: { profile: true },
    });
    return NextResponse.json(price, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al crear precio' }, { status: 500 });
  }
}

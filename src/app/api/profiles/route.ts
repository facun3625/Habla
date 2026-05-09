import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const profiles = await prisma.profile.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  try {
    const profile = await prisma.profile.create({ data: { name: name.trim(), description } });
    return NextResponse.json(profile, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ya existe un perfil con ese nombre' }, { status: 409 });
  }
}

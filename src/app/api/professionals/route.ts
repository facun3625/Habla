import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pros = await prisma.professional.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(pros);
  } catch (error) {
    console.error('Error fetching professionals:', error);
    return NextResponse.json({ error: 'Error fetching professionals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const pro = await prisma.professional.create({
      data: {
        name: data.name,
        role: data.role,
        bio: data.bio,
        cvContent: data.cvContent,
        imageUrl: data.imageUrl,
        instagram: data.instagram ?? null,
        active: data.active ?? true,
      }
    });
    return NextResponse.json(pro, { status: 201 });
  } catch (error) {
    console.error('Error creating professional:', error);
    return NextResponse.json({ error: 'Error creating professional' }, { status: 500 });
  }
}

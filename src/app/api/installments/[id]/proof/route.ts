import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, COOKIE } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

type P = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: P) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    await verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No se recibió archivo.' }, { status: 400 });

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts');
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

  const filename = `cuota-${id}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const filePath = join(uploadDir, filename);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  const proofUrl = `/uploads/receipts/${filename}`;

  const installment = await prisma.installment.update({
    where: { id: Number(id) },
    data: { proofUrl, status: 'SUBMITTED', submittedAt: new Date() },
  });

  return NextResponse.json(installment);
}

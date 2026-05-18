import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

type P = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: P) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No se recibió archivo.' }, { status: 400 });

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts');
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

  const filename = `receipt-${id}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const path = join(uploadDir, filename);
  await writeFile(path, Buffer.from(await file.arrayBuffer()));
  const receiptUrl = `/uploads/receipts/${filename}`;

  const enrollment = await prisma.enrollment.update({
    where: { id: Number(id) },
    data: { receiptUrl, status: 'COMPROBANTE_SUBIDO' },
    include: { installmentPlan: { include: { installments: { orderBy: { number: 'asc' }, take: 1 } } } },
  });

  // Link receipt to first installment if plan exists
  if (enrollment.installmentPlan?.installments[0]) {
    const first = enrollment.installmentPlan.installments[0];
    await prisma.installment.update({
      where: { id: first.id },
      data: { proofUrl: receiptUrl, status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  return NextResponse.json(enrollment);
}

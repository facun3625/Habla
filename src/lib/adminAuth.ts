import { NextRequest } from 'next/server';
import { COOKIE, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });
    return user?.role === 'ADMIN' ? payload : null;
  } catch {
    return null;
  }
}

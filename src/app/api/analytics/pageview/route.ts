import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_PATTERN = /bot|crawl|spider|slurp|mediapartners|lighthouse|pagespeed|headless/i;

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') ?? '';
    if (BOT_PATTERN.test(ua)) return NextResponse.json({ ok: true });

    const { path, referrer } = await req.json();
    if (!path || typeof path !== 'string') return NextResponse.json({ ok: true });

    await prisma.pageView.create({
      data: {
        path: path.slice(0, 500),
        referrer: referrer ? String(referrer).slice(0, 500) : null,
        userAgent: ua.slice(0, 500) || null,
      },
    });
  } catch {}

  return NextResponse.json({ ok: true });
}

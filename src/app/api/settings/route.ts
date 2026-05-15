import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Keys that are safe to expose to the frontend (non-secret)
const PUBLIC_KEYS = new Set([
  'mp_enabled', 'mp_public_key', 'mp_mode',
  'paypal_enabled', 'paypal_client_id', 'paypal_mode',
  'transfer_ar_enabled',
  'transfer_bank', 'transfer_cbu', 'transfer_alias', 'transfer_holder', 'transfer_reference_note',
  'transfer_ext_enabled',
  'transfer_ext_bank', 'transfer_ext_cbu', 'transfer_ext_alias', 'transfer_ext_holder',
  'instagram_url', 'youtube_url',
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const publicOnly = searchParams.get('public') === '1';

  const rows = await prisma.setting.findMany();
  const settings: Record<string, string> = {};
  for (const r of rows) {
    if (publicOnly && !PUBLIC_KEYS.has(r.key)) continue;
    // Mask secrets in public mode
    settings[r.key] = r.value;
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  try {
    const body: Record<string, string> = await req.json();
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Settings PUT error:', e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}

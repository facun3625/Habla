import { NextResponse } from 'next/server';
// Segments replaced by global Profiles. Use /api/courses/[id]/access instead.
export async function GET() { return NextResponse.json([]); }
export async function POST() { return NextResponse.json({ error: 'Use /api/courses/[id]/access' }, { status: 410 }); }

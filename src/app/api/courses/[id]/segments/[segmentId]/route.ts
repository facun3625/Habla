import { NextResponse } from 'next/server';
// Segments replaced by global Profiles.
export async function DELETE() { return NextResponse.json({ error: 'Use /api/courses/[id]/access' }, { status: 410 }); }

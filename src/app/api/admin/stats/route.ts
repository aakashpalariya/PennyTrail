import { NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// GET /api/admin/stats — system level stats for admin portal
export async function GET() {
  try {
    const stats = await serverDb.getAdminSystemStats();
    return NextResponse.json({ stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

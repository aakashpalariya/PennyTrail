import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// POST /api/admin/auth — verify admin password
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const isValid = await serverDb.verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      role: 'admin',
      authenticatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

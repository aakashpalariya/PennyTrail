import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// POST /api/admin/password — change admin password
export async function POST(req: NextRequest) {
  try {
    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
    }

    const res = await serverDb.changeAdminPassword(oldPassword, newPassword);
    if (!res.success) {
      return NextResponse.json({ error: res.error ?? 'Failed to change password' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: 'Admin password successfully updated' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

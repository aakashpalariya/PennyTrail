import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// PATCH /api/admin/users/[id] — update user or reset password
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await serverDb.adminUpdateUser(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { passwordHash: _, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser, ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — delete user account and all data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await serverDb.deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, message: 'User account and all associated records deleted.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

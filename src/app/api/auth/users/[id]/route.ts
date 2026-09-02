import { NextRequest, NextResponse } from 'next/server';
import { serverDb, hashPassword } from '@/server/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, avatarEmoji, currency, oldPassword, newPassword } = body;

    if (oldPassword && newPassword) {
      const user = await serverDb.findUserById(id);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (hashPassword(oldPassword) !== user.passwordHash) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
      await serverDb.updateUser(id, { passwordHash: hashPassword(newPassword) });
      return NextResponse.json({ ok: true });
    }

    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name;
    if (avatarEmoji !== undefined) updates.avatarEmoji = avatarEmoji;
    if (currency !== undefined) updates.currency = currency;

    const updated = await serverDb.updateUser(id, updates);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const { passwordHash: _, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

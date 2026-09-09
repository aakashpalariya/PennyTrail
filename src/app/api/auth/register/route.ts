import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, dob, currency } = await req.json();
    if (!name || !email || !password || !dob) return NextResponse.json({ error: 'All fields including Date of Birth are required' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

    const user = await serverDb.createUser({ name, email, password, dob, currency });
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

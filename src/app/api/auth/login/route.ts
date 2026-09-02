import { NextRequest, NextResponse } from 'next/server';
import { serverDb, hashPassword } from '@/server/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const user = await serverDb.findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'No account found with this email.' }, { status: 401 });
    if (hashPassword(password) !== user.passwordHash) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    if (!user.isActive) return NextResponse.json({ error: 'This account is inactive.' }, { status: 403 });

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

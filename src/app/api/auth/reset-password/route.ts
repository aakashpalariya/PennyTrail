import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

export async function POST(req: NextRequest) {
  try {
    const { email, dob, newPassword } = await req.json();

    if (!email || !dob || !newPassword) {
      return NextResponse.json({ error: 'Email, Date of Birth, and New Password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const result = await serverDb.resetPasswordByDob(email, dob, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Password reset failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Password has been reset successfully!' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reset password failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

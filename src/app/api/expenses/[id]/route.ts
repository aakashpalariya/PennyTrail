import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// GET /api/expenses/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await serverDb.getExpenseById(id);
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ expense });
}

// PATCH /api/expenses/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { action, ...updates } = body;

  if (action === 'delete') {
    await serverDb.softDeleteExpense(id);
    return NextResponse.json({ ok: true });
  }
  if (action === 'restore') {
    await serverDb.restoreExpense(id);
    return NextResponse.json({ ok: true });
  }

  const expense = await serverDb.updateExpense(id, updates);
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ expense });
}

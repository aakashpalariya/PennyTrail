import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// GET /api/budgets?userId=...&month=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const month = searchParams.get('month');
  if (!userId || !month) return NextResponse.json({ error: 'userId and month required' }, { status: 400 });
  const budgets = await serverDb.getBudgets(userId, month);
  return NextResponse.json({ budgets });
}

// POST /api/budgets (upsert)
export async function POST(req: NextRequest) {
  const { userId, month, categoryId, amount, currency } = await req.json();
  if (!userId || !month || !categoryId || amount == null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const budget = await serverDb.upsertBudget(userId, month, categoryId, amount, currency ?? 'INR');
  return NextResponse.json({ budget });
}

// DELETE /api/budgets
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await serverDb.deleteBudget(id);
  return NextResponse.json({ ok: true });
}

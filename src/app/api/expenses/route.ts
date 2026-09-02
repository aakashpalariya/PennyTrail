import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/server/db';

// GET /api/expenses?userId=...&month=...&date=...&startDate=...&endDate=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const month = searchParams.get('month');
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let expenses;
  if (date) {
    expenses = await serverDb.getExpensesForDate(userId, date);
  } else if (month) {
    expenses = await serverDb.getExpensesForMonth(userId, month);
  } else if (startDate && endDate) {
    expenses = await serverDb.getExpensesForRange(userId, startDate, endDate);
  } else {
    expenses = await serverDb.getExpenses(userId);
  }

  return NextResponse.json({ expenses });
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...input } = body;
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const expense = await serverDb.createExpense(userId, input);
    return NextResponse.json({ expense }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

import { db } from '../database';
import { Expense, PaymentMethod, RecurringInterval } from '../schema';
import { format } from 'date-fns';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type CreateExpenseInput = {
  title: string;
  note?: string;
  amount: number; // in minor units
  currency: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  receiptData?: string;
  receiptName?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
};

export const expenseRepository = {
  async create(userId: string, input: CreateExpenseInput): Promise<Expense> {
    const now = new Date().toISOString();
    const expense: Expense = {
      id: generateId(),
      userId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      isRecurring: false,
      ...input,
    };
    await db.expenses.add(expense);
    return expense;
  },

  async update(id: string, input: Partial<CreateExpenseInput>): Promise<void> {
    await db.expenses.update(id, { ...input, updatedAt: new Date().toISOString() });
  },

  async softDelete(id: string): Promise<void> {
    await db.expenses.update(id, { isDeleted: true, updatedAt: new Date().toISOString() });
  },

  async restore(id: string): Promise<void> {
    await db.expenses.update(id, { isDeleted: false, updatedAt: new Date().toISOString() });
  },

  async getById(id: string): Promise<Expense | undefined> {
    return db.expenses.get(id);
  },

  // All non-deleted for user
  async getAllForUser(userId: string): Promise<Expense[]> {
    return db.expenses
      .where('[userId+isDeleted]')
      .equals([userId, 0])
      .reverse()
      .sortBy('date');
  },

  // For a specific month YYYY-MM
  async getForMonth(userId: string, month: string): Promise<Expense[]> {
    const start = `${month}-01`;
    const end = `${month}-31`;
    return db.expenses
      .where('[userId+date]')
      .between([userId, start], [userId, end], true, true)
      .filter(e => !e.isDeleted)
      .toArray();
  },

  // For a specific date range
  async getForRange(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
    return db.expenses
      .where('[userId+date]')
      .between([userId, startDate], [userId, endDate], true, true)
      .filter(e => !e.isDeleted)
      .toArray();
  },

  // For a specific date YYYY-MM-DD
  async getForDate(userId: string, date: string): Promise<Expense[]> {
    return db.expenses
      .where('[userId+date]')
      .equals([userId, date])
      .filter(e => !e.isDeleted)
      .toArray();
  },

  // Total for a month in minor units
  async getTotalForMonth(userId: string, month: string): Promise<number> {
    const expenses = await this.getForMonth(userId, month);
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  },

  // Daily totals for last N days
  async getDailyTotals(userId: string, days: number): Promise<{ date: string; total: number }[]> {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startTs = new Date();
    startTs.setDate(startTs.getDate() - days + 1);
    const startDate = format(startTs, 'yyyy-MM-dd');

    const expenses = await this.getForRange(userId, startDate, endDate);

    const map = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(format(d, 'yyyy-MM-dd'), 0);
    }

    for (const e of expenses) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
    }

    return Array.from(map.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Category totals for a month
  async getCategoryTotalsForMonth(
    userId: string,
    month: string
  ): Promise<{ categoryId: string; total: number }[]> {
    const expenses = await this.getForMonth(userId, month);
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([categoryId, total]) => ({ categoryId, total }));
  },

  // Monthly totals for last N months
  async getMonthlyTotals(userId: string, months: number): Promise<{ month: string; total: number }[]> {
    const result: { month: string; total: number }[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const month = format(d, 'yyyy-MM');
      const total = await this.getTotalForMonth(userId, month);
      result.unshift({ month, total });
    }
    return result;
  },

  // Export — all non-deleted for a date range
  async getForExport(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
    return this.getForRange(userId, startDate, endDate);
  },
};

import { db } from '../database';
import { Budget } from '../schema';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const budgetRepository = {
  async upsert(userId: string, month: string, categoryId: string, amount: number, currency: string): Promise<Budget> {
    const existing = await db.budgets
      .where('[userId+month+categoryId]')
      .equals([userId, month, categoryId])
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await db.budgets.update(existing.id, { amount, currency, updatedAt: now });
      return { ...existing, amount, currency, updatedAt: now };
    }

    const budget: Budget = {
      id: generateId(),
      userId,
      month,
      categoryId,
      amount,
      currency,
      createdAt: now,
      updatedAt: now,
    };
    await db.budgets.add(budget);
    return budget;
  },

  async getForMonth(userId: string, month: string): Promise<Budget[]> {
    return db.budgets
      .where('[userId+month]')
      .equals([userId, month])
      .toArray();
  },

  async getGlobal(userId: string, month: string): Promise<Budget | undefined> {
    return db.budgets
      .where('[userId+month+categoryId]')
      .equals([userId, month, 'global'])
      .first();
  },

  async delete(id: string): Promise<void> {
    await db.budgets.delete(id);
  },
};

import Dexie, { Table } from 'dexie';
import { AppUser, Expense, Category, Budget } from './schema';

export class PennyTrailDatabase extends Dexie {
  appUsers!: Table<AppUser, string>;
  expenses!: Table<Expense, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;

  constructor() {
    super('PennyTrailDB');

    this.version(1).stores({
      appUsers: 'id, email, isActive',
      expenses: 'id, userId, categoryId, date, paymentMethod, isDeleted, isRecurring, [userId+isDeleted], [userId+date], [userId+categoryId]',
      categories: 'id, userId, isDefault, [userId+name]',
      budgets: 'id, userId, month, categoryId, [userId+month], [userId+month+categoryId]',
    });
  }
}

// Singleton instance
export const db = new PennyTrailDatabase();

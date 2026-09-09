// Typed API client — all calls go through Next.js API routes
// Data is stored server-side in data/pennytrail_data.json
// This enables cross-device access when hosted on a shared server/network

import { format, subMonths } from 'date-fns';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'OTHER';
export type RecurringInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  dob?: string;
  avatarEmoji: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  note?: string;
  amount: number;
  currency: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string;
  receiptData?: string;
  receiptName?: string;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;
  categoryId: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const apiClient = {
  auth: {
    async login(email: string, password: string): Promise<AppUser> {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Login failed');
      return data.user;
    },
    async register(name: string, email: string, password: string, dob?: string, currency?: string): Promise<AppUser> {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, dob, currency }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');
      return data.user;
    },
    async resetPassword(email: string, dob: string, newPassword: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, dob, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Password reset failed');
      return data;
    },
    async updateProfile(userId: string, updates: Partial<Pick<AppUser, 'name' | 'avatarEmoji' | 'currency'>>): Promise<AppUser> {
      const res = await fetch(`/api/auth/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      return data.user;
    },
    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
      const res = await fetch(`/api/auth/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Password change failed');
    },
  },

  // ─── Expenses ────────────────────────────────────────────────────────────

  expenses: {
    async getAll(userId: string): Promise<Expense[]> {
      const res = await fetch(`/api/expenses?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      return data.expenses ?? [];
    },
    async getForMonth(userId: string, month: string): Promise<Expense[]> {
      const res = await fetch(`/api/expenses?userId=${encodeURIComponent(userId)}&month=${month}`);
      const data = await res.json();
      return (data.expenses ?? []).sort((a: Expense, b: Expense) => b.date.localeCompare(a.date));
    },
    async getForDate(userId: string, date: string): Promise<Expense[]> {
      const res = await fetch(`/api/expenses?userId=${encodeURIComponent(userId)}&date=${date}`);
      const data = await res.json();
      return data.expenses ?? [];
    },
    async getForRange(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
      const res = await fetch(`/api/expenses?userId=${encodeURIComponent(userId)}&startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      return data.expenses ?? [];
    },
    async getById(id: string): Promise<Expense | null> {
      const res = await fetch(`/api/expenses/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.expense;
    },
    async create(userId: string, input: Omit<Expense, 'id' | 'userId' | 'isDeleted' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...input }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create');
      return data.expense;
    },
    async update(id: string, updates: Partial<Expense>): Promise<void> {
      await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    },
    async softDelete(id: string): Promise<void> {
      await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete' }) });
    },
    async restore(id: string): Promise<void> {
      await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore' }) });
    },

    // Computed helpers (client-side)
    getDailyTotals(expenses: Expense[], days: number): { date: string; total: number; label: string }[] {
      const map = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        map.set(format(d, 'yyyy-MM-dd'), 0);
      }
      for (const e of expenses) {
        const d = e.date;
        if (map.has(d)) map.set(d, (map.get(d) ?? 0) + e.amount);
      }
      return Array.from(map.entries())
        .map(([date, total]) => ({ date, total, label: format(new Date(date + 'T00:00:00'), 'EEE') }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },

    getCategoryTotals(expenses: Expense[]): { categoryId: string; total: number }[] {
      const map = new Map<string, number>();
      for (const e of expenses) map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
      return Array.from(map.entries()).map(([categoryId, total]) => ({ categoryId, total }));
    },

    async getMonthlyTotals(userId: string, months: number): Promise<{ month: string; total: number; label: string }[]> {
      const result = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const month = format(d, 'yyyy-MM');
        const exps = await this.getForMonth(userId, month);
        const total = exps.reduce((s, e) => s + e.amount, 0);
        result.push({ month, total, label: format(d, 'MMM') });
      }
      return result;
    },
  },

  // ─── Categories ──────────────────────────────────────────────────────────

  categories: {
    async getAll(userId: string): Promise<Category[]> {
      const res = await fetch(`/api/categories?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      return data.categories ?? [];
    },
    async create(userId: string, input: { name: string; icon: string; color: string }): Promise<Category> {
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...input }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      return data.category;
    },
    async update(id: string, updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>): Promise<void> {
      await fetch('/api/categories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    },
    async delete(id: string): Promise<void> {
      await fetch('/api/categories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'delete' }) });
    },
  },

  // ─── Budgets ─────────────────────────────────────────────────────────────

  budgets: {
    async getForMonth(userId: string, month: string): Promise<Budget[]> {
      const res = await fetch(`/api/budgets?userId=${encodeURIComponent(userId)}&month=${month}`);
      const data = await res.json();
      return data.budgets ?? [];
    },
    async upsert(userId: string, month: string, categoryId: string, amount: number, currency: string): Promise<Budget> {
      const res = await fetch('/api/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, month, categoryId, amount, currency }) });
      const data = await res.json();
      return data.budget;
    },
    async delete(id: string): Promise<void> {
      await fetch('/api/budgets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    },
  },
};

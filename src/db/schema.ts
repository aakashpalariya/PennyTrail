// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'USER';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'OTHER';

export type RecurringInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type BudgetPeriod = 'MONTHLY'; // extendable later

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // bcrypt-style hash (we use a simple hash since local-only)
  dob?: string; // Date of birth (YYYY-MM-DD or DD/MM/YYYY)
  avatarEmoji?: string; // e.g. "🐱"
  currency: string; // 'INR' | 'USD' etc.
  role: UserRole;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  note?: string;
  amount: number; // integer minor units (paise for INR, cents for USD)
  currency: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  receiptData?: string; // base64 data URI
  receiptName?: string;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string | 'global'; // 'global' = default categories for all users
  name: string;
  icon: string; // emoji
  color: string; // tailwind color token or hex
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: string; // 'YYYY-MM'
  categoryId: string | 'global'; // 'global' = overall monthly budget
  amount: number; // integer minor units
  currency: string;
  createdAt: string;
  updatedAt: string;
}

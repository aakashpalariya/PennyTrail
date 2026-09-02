import { db } from '../database';
import { Category } from '../schema';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { userId: 'global', name: 'Food & Dining',    icon: '🍽️', color: '#f97316', isDefault: true },
  { userId: 'global', name: 'Transport',         icon: '🚗', color: '#3b82f6', isDefault: true },
  { userId: 'global', name: 'Shopping',          icon: '🛍️', color: '#ec4899', isDefault: true },
  { userId: 'global', name: 'Bills & Utilities', icon: '💡', color: '#eab308', isDefault: true },
  { userId: 'global', name: 'Health',            icon: '🏥', color: '#ef4444', isDefault: true },
  { userId: 'global', name: 'Entertainment',     icon: '🎬', color: '#8b5cf6', isDefault: true },
  { userId: 'global', name: 'Education',         icon: '📚', color: '#06b6d4', isDefault: true },
  { userId: 'global', name: 'Groceries',         icon: '🛒', color: '#84cc16', isDefault: true },
  { userId: 'global', name: 'Travel',            icon: '✈️', color: '#0ea5e9', isDefault: true },
  { userId: 'global', name: 'Other',             icon: '📦', color: '#6b7280', isDefault: true },
];

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const categoryRepository = {
  async seedDefaults(): Promise<void> {
    const existing = await db.categories.where('userId').equals('global').count();
    if (existing > 0) return;

    const now = new Date().toISOString();
    const records: Category[] = DEFAULT_CATEGORIES.map(c => ({
      ...c,
      id: generateId(),
      createdAt: now,
    }));
    await db.categories.bulkAdd(records);
  },

  async getAllForUser(userId: string): Promise<Category[]> {
    const globals = await db.categories.where('userId').equals('global').toArray();
    const user = await db.categories.where('userId').equals(userId).toArray();
    return [...globals, ...user];
  },

  async create(userId: string, data: { name: string; icon: string; color: string }): Promise<Category> {
    const now = new Date().toISOString();
    const category: Category = {
      id: generateId(),
      userId,
      name: data.name.trim(),
      icon: data.icon,
      color: data.color,
      isDefault: false,
      createdAt: now,
    };
    await db.categories.add(category);
    return category;
  },

  async update(id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color'>>): Promise<void> {
    await db.categories.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.categories.delete(id);
  },
};

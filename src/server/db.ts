import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { createClient, type Client, type Row } from '@libsql/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'OTHER';
export type RecurringInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarEmoji: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBExpense {
  id: string;
  userId: string;
  title: string;
  note?: string;
  amount: number;        // minor units
  currency: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  date: string;          // YYYY-MM-DD
  receiptData?: string;  // base64
  receiptName?: string;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DBCategory {
  id: string;
  userId: string | 'global';
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isActive?: boolean;
  createdAt: string;
}

export interface DBBudget {
  id: string;
  userId: string;
  month: string;           // YYYY-MM
  categoryId: string;      // 'global' or category id
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBSchema {
  users: DBUser[];
  expenses: DBExpense[];
  categories: DBCategory[];
  budgets: DBBudget[];
  adminPasswordHash?: string;
}

// ─── Default Categories ──────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES: Omit<DBCategory, 'createdAt'>[] = [
  { id: 'cat-food',      userId: 'global', name: 'Food & Dining',    icon: '🍽️', color: '#f97316', isDefault: true, isActive: true },
  { id: 'cat-transport', userId: 'global', name: 'Transport',         icon: '🚗', color: '#3b82f6', isDefault: true, isActive: true },
  { id: 'cat-shopping',  userId: 'global', name: 'Shopping',          icon: '🛍️', color: '#ec4899', isDefault: true, isActive: true },
  { id: 'cat-bills',     userId: 'global', name: 'Bills & Utilities', icon: '💡', color: '#eab308', isDefault: true, isActive: true },
  { id: 'cat-health',    userId: 'global', name: 'Health',            icon: '🏥', color: '#ef4444', isDefault: true, isActive: true },
  { id: 'cat-entertain', userId: 'global', name: 'Entertainment',     icon: '🎬', color: '#8b5cf6', isDefault: true, isActive: true },
  { id: 'cat-education', userId: 'global', name: 'Education',         icon: '📚', color: '#06b6d4', isDefault: true, isActive: true },
  { id: 'cat-groceries', userId: 'global', name: 'Groceries',         icon: '🛒', color: '#84cc16', isDefault: true, isActive: true },
  { id: 'cat-travel',    userId: 'global', name: 'Travel',            icon: '✈️', color: '#0ea5e9', isDefault: true, isActive: true },
  { id: 'cat-other',     userId: 'global', name: 'Other',             icon: '📦', color: '#6b7280', isDefault: true, isActive: true },
];

// ─── File Paths & Password Hashing ──────────────────────────────────────────

function getDataPaths(): { dataDir: string; sqliteDbPath: string; jsonFilePath: string } {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY
  );
  const targetDir = isServerless
    ? path.join('/tmp', 'pennytrail_data')
    : path.join(process.cwd(), 'data');
  return {
    dataDir: targetDir,
    sqliteDbPath: path.join(targetDir, 'pennytrail.db'),
    jsonFilePath: path.join(targetDir, 'pennytrail_data.json'),
  };
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'pennytrail-salt').digest('hex');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Row Mappers ─────────────────────────────────────────────────────────────

function mapUser(row: Row): DBUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    currency: String(row.currency || 'INR'),
    avatarEmoji: String(row.avatar_emoji || '👤'),
    isActive: Number(row.is_active) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapExpense(row: Row): DBExpense {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    note: row.note ? String(row.note) : undefined,
    amount: Number(row.amount),
    currency: String(row.currency),
    categoryId: String(row.category_id),
    paymentMethod: String(row.payment_method) as PaymentMethod,
    date: String(row.date),
    receiptData: row.receipt_data ? String(row.receipt_data) : undefined,
    receiptName: row.receipt_name ? String(row.receipt_name) : undefined,
    isRecurring: Number(row.is_recurring) === 1,
    recurringInterval: row.recurring_interval ? (String(row.recurring_interval) as RecurringInterval) : undefined,
    isDeleted: Number(row.is_deleted) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapCategory(row: Row): DBCategory {
  return {
    id: String(row.id),
    userId: String(row.user_id) as string | 'global',
    name: String(row.name),
    icon: String(row.icon),
    color: String(row.color),
    isDefault: Number(row.is_default) === 1,
    isActive: Number(row.is_active) === 1,
    createdAt: String(row.created_at),
  };
}

function mapBudget(row: Row): DBBudget {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    month: String(row.month),
    categoryId: String(row.category_id),
    amount: Number(row.amount),
    currency: String(row.currency),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// ─── PennyTrail SQLite Database Engine ──────────────────────────────────────

export class PennyTrailSQLiteDB {
  private client: Client;
  private initPromise: Promise<void> | null = null;
  private paths: { dataDir: string; sqliteDbPath: string; jsonFilePath: string };

  constructor() {
    this.paths = getDataPaths();
    if (!fs.existsSync(this.paths.dataDir)) {
      fs.mkdirSync(this.paths.dataDir, { recursive: true });
    }
    this.client = createClient({
      url: `file:${this.paths.sqliteDbPath}`,
    });
  }

  // Ensure DB tables, indexes, and initial data migration are executed
  public async ready(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initializeDatabase();
    }
    return this.initPromise;
  }

  private async initializeDatabase(): Promise<void> {
    // 1. Create Tables
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        avatar_emoji TEXT NOT NULL DEFAULT '👤',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        category_id TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        receipt_data TEXT,
        receipt_name TEXT,
        is_recurring INTEGER NOT NULL DEFAULT 0,
        recurring_interval TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        category_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, month, category_id)
      );
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // 2. Create Indexes
    await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, is_active);`);
    await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id, is_deleted);`);
    await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);`);
    await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_expenses_cat ON expenses(category_id);`);
    await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);`);

    // 3. Migrate from existing JSON DB file if present
    await this.migrateFromJsonIfAvailable();

    // 4. Ensure default global categories exist
    const catCheck = await this.client.execute(`SELECT COUNT(*) as count FROM categories WHERE user_id = 'global';`);
    const globalCatCount = Number(catCheck.rows[0]?.count ?? 0);
    if (globalCatCount === 0) {
      const now = new Date().toISOString();
      for (const c of DEFAULT_CATEGORIES) {
        await this.client.execute({
          sql: `INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, is_default, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [c.id, c.userId, c.name, c.icon, c.color, c.isDefault ? 1 : 0, c.isActive !== false ? 1 : 0, now],
        });
      }
    }
  }

  private async migrateFromJsonIfAvailable(): Promise<void> {
    try {
      const migrationCheck = await this.client.execute(`SELECT value FROM system_config WHERE key = 'migrated_from_json';`);
      if (migrationCheck.rows.length > 0) return; // Already migrated

      if (!fs.existsSync(this.paths.jsonFilePath)) return; // No JSON file to migrate

      const raw = fs.readFileSync(this.paths.jsonFilePath, 'utf8');
      const data: Partial<DBSchema> = JSON.parse(raw);

      // Migrate Users
      if (data.users && Array.isArray(data.users)) {
        for (const u of data.users) {
          await this.client.execute({
            sql: `INSERT OR REPLACE INTO users (id, name, email, password_hash, currency, avatar_emoji, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              u.id,
              u.name,
              u.email.toLowerCase().trim(),
              u.passwordHash,
              u.currency || 'INR',
              u.avatarEmoji || '👤',
              u.isActive !== false ? 1 : 0,
              u.createdAt || new Date().toISOString(),
              u.updatedAt || new Date().toISOString(),
            ],
          });
        }
      }

      // Migrate Categories
      if (data.categories && Array.isArray(data.categories)) {
        for (const c of data.categories) {
          await this.client.execute({
            sql: `INSERT OR REPLACE INTO categories (id, user_id, name, icon, color, is_default, is_active, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              c.id,
              c.userId,
              c.name,
              c.icon,
              c.color,
              c.isDefault ? 1 : 0,
              c.isActive !== false ? 1 : 0,
              c.createdAt || new Date().toISOString(),
            ],
          });
        }
      }

      // Migrate Expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const e of data.expenses) {
          await this.client.execute({
            sql: `INSERT OR REPLACE INTO expenses (id, user_id, title, amount, currency, category_id, payment_method, date, note, receipt_data, receipt_name, is_recurring, recurring_interval, is_deleted, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              e.id,
              e.userId,
              e.title,
              e.amount,
              e.currency || 'INR',
              e.categoryId,
              e.paymentMethod || 'OTHER',
              e.date,
              e.note || null,
              e.receiptData || null,
              e.receiptName || null,
              e.isRecurring ? 1 : 0,
              e.recurringInterval || null,
              e.isDeleted ? 1 : 0,
              e.createdAt || new Date().toISOString(),
              e.updatedAt || new Date().toISOString(),
            ],
          });
        }
      }

      // Migrate Budgets
      if (data.budgets && Array.isArray(data.budgets)) {
        for (const b of data.budgets) {
          await this.client.execute({
            sql: `INSERT OR REPLACE INTO budgets (id, user_id, month, category_id, amount, currency, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              b.id,
              b.userId,
              b.month,
              b.categoryId,
              b.amount,
              b.currency || 'INR',
              b.createdAt || new Date().toISOString(),
              b.updatedAt || new Date().toISOString(),
            ],
          });
        }
      }

      // Migrate Admin Password Hash
      if (data.adminPasswordHash) {
        await this.client.execute({
          sql: `INSERT OR REPLACE INTO system_config (key, value) VALUES ('admin_password_hash', ?)`,
          args: [data.adminPasswordHash],
        });
      }

      // Mark migration done
      await this.client.execute({
        sql: `INSERT INTO system_config (key, value) VALUES ('migrated_from_json', ?)`,
        args: [new Date().toISOString()],
      });

      // Safely back up the original JSON file
      try {
        fs.copyFileSync(this.paths.jsonFilePath, `${this.paths.jsonFilePath}.bak`);
      } catch {
        // Ignore backup copy failure
      }
    } catch (err) {
      console.error('Error during SQLite auto-migration from JSON:', err);
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<DBUser | undefined> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1;`,
      args: [email.trim()],
    });
    return res.rows[0] ? mapUser(res.rows[0]) : undefined;
  }

  async findUserById(id: string): Promise<DBUser | undefined> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM users WHERE id = ? LIMIT 1;`,
      args: [id],
    });
    return res.rows[0] ? mapUser(res.rows[0]) : undefined;
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    currency?: string;
    avatarEmoji?: string;
  }): Promise<DBUser> {
    await this.ready();
    const now = new Date().toISOString();
    const id = generateId();
    const currency = input.currency || 'INR';
    const avatarEmoji = input.avatarEmoji || '👤';
    const passwordHash = hashPassword(input.password);

    await this.client.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, currency, avatar_emoji, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?);`,
      args: [id, input.name.trim(), input.email.toLowerCase().trim(), passwordHash, currency, avatarEmoji, now, now],
    });

    return {
      id,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      avatarEmoji,
      currency,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateUser(
    id: string,
    updates: Partial<Pick<DBUser, 'name' | 'email' | 'currency' | 'avatarEmoji' | 'isActive' | 'passwordHash'>>
  ): Promise<DBUser | undefined> {
    await this.ready();
    const existing = await this.findUserById(id);
    if (!existing) return undefined;

    const name = updates.name !== undefined ? updates.name.trim() : existing.name;
    const email = updates.email !== undefined ? updates.email.toLowerCase().trim() : existing.email;
    const currency = updates.currency !== undefined ? updates.currency : existing.currency;
    const avatarEmoji = updates.avatarEmoji !== undefined ? updates.avatarEmoji : existing.avatarEmoji;
    const isActive = updates.isActive !== undefined ? updates.isActive : existing.isActive;
    const passwordHash = updates.passwordHash !== undefined ? updates.passwordHash : existing.passwordHash;
    const updatedAt = new Date().toISOString();

    await this.client.execute({
      sql: `UPDATE users
            SET name = ?, email = ?, currency = ?, avatar_emoji = ?, is_active = ?, password_hash = ?, updated_at = ?
            WHERE id = ?;`,
      args: [name, email, currency, avatarEmoji, isActive ? 1 : 0, passwordHash, updatedAt, id],
    });

    return {
      ...existing,
      name,
      email,
      currency,
      avatarEmoji,
      isActive,
      passwordHash,
      updatedAt,
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ready();
    await this.client.execute({ sql: `DELETE FROM users WHERE id = ?;`, args: [id] });
    await this.client.execute({ sql: `DELETE FROM expenses WHERE user_id = ?;`, args: [id] });
    await this.client.execute({ sql: `DELETE FROM budgets WHERE user_id = ?;`, args: [id] });
    await this.client.execute({ sql: `DELETE FROM categories WHERE user_id = ?;`, args: [id] });
    return true;
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  async getExpenses(userId: string): Promise<DBExpense[]> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM expenses WHERE user_id = ? AND is_deleted = 0 ORDER BY date DESC, created_at DESC;`,
      args: [userId],
    });
    return res.rows.map(mapExpense);
  }

  async getExpensesForMonth(userId: string, month: string): Promise<DBExpense[]> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM expenses
            WHERE user_id = ? AND is_deleted = 0 AND date LIKE ?
            ORDER BY date DESC, created_at DESC;`,
      args: [userId, `${month}%`],
    });
    return res.rows.map(mapExpense);
  }

  async getExpensesForDate(userId: string, date: string): Promise<DBExpense[]> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM expenses
            WHERE user_id = ? AND is_deleted = 0 AND date = ?
            ORDER BY created_at DESC;`,
      args: [userId, date],
    });
    return res.rows.map(mapExpense);
  }

  async getExpensesForRange(userId: string, start: string, end: string): Promise<DBExpense[]> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM expenses
            WHERE user_id = ? AND is_deleted = 0 AND date >= ? AND date <= ?
            ORDER BY date DESC, created_at DESC;`,
      args: [userId, start, end],
    });
    return res.rows.map(mapExpense);
  }

  async getExpenseById(id: string): Promise<DBExpense | undefined> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM expenses WHERE id = ? LIMIT 1;`,
      args: [id],
    });
    return res.rows[0] ? mapExpense(res.rows[0]) : undefined;
  }

  async createExpense(
    userId: string,
    input: Omit<DBExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<DBExpense> {
    await this.ready();
    const id = generateId();
    const now = new Date().toISOString();

    await this.client.execute({
      sql: `INSERT INTO expenses (id, user_id, title, amount, currency, category_id, payment_method, date, note, receipt_data, receipt_name, is_recurring, recurring_interval, is_deleted, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?);`,
      args: [
        id,
        userId,
        input.title.trim(),
        input.amount,
        input.currency,
        input.categoryId,
        input.paymentMethod,
        input.date,
        input.note || null,
        input.receiptData || null,
        input.receiptName || null,
        input.isRecurring ? 1 : 0,
        input.recurringInterval || null,
        now,
        now,
      ],
    });

    return {
      id,
      userId,
      ...input,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateExpense(
    id: string,
    updates: Partial<Omit<DBExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<DBExpense | undefined> {
    await this.ready();
    const existing = await this.getExpenseById(id);
    if (!existing) return undefined;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    await this.client.execute({
      sql: `UPDATE expenses
            SET title = ?, amount = ?, currency = ?, category_id = ?, payment_method = ?, date = ?, note = ?, receipt_data = ?, receipt_name = ?, is_recurring = ?, recurring_interval = ?, is_deleted = ?, updated_at = ?
            WHERE id = ?;`,
      args: [
        merged.title,
        merged.amount,
        merged.currency,
        merged.categoryId,
        merged.paymentMethod,
        merged.date,
        merged.note || null,
        merged.receiptData || null,
        merged.receiptName || null,
        merged.isRecurring ? 1 : 0,
        merged.recurringInterval || null,
        merged.isDeleted ? 1 : 0,
        merged.updatedAt,
        id,
      ],
    });

    return merged;
  }

  async softDeleteExpense(id: string): Promise<boolean> {
    await this.ready();
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: `UPDATE expenses SET is_deleted = 1, updated_at = ? WHERE id = ?;`,
      args: [now, id],
    });
    return res.rowsAffected > 0;
  }

  async restoreExpense(id: string): Promise<boolean> {
    await this.ready();
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: `UPDATE expenses SET is_deleted = 0, updated_at = ? WHERE id = ?;`,
      args: [now, id],
    });
    return res.rowsAffected > 0;
  }

  async permanentDeleteExpense(id: string): Promise<boolean> {
    await this.ready();
    const res = await this.client.execute({
      sql: `DELETE FROM expenses WHERE id = ?;`,
      args: [id],
    });
    return res.rowsAffected > 0;
  }

  // ── Categories ───────────────────────────────────────────────────────────

  async getCategories(userId: string): Promise<DBCategory[]> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM categories
            WHERE is_active = 1 AND (user_id = 'global' OR user_id = ?)
            ORDER BY is_default DESC, created_at ASC;`,
      args: [userId],
    });
    return res.rows.map(mapCategory);
  }

  async createCategory(userId: string, input: { name: string; icon: string; color: string }): Promise<DBCategory> {
    await this.ready();
    const now = new Date().toISOString();
    const id = generateId();

    await this.client.execute({
      sql: `INSERT INTO categories (id, user_id, name, icon, color, is_default, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 1, ?);`,
      args: [id, userId, input.name.trim(), input.icon, input.color, now],
    });

    return {
      id,
      userId,
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      isDefault: false,
      isActive: true,
      createdAt: now,
    };
  }

  async updateCategory(id: string, updates: Partial<Pick<DBCategory, 'name' | 'icon' | 'color'>>): Promise<boolean> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM categories WHERE id = ? LIMIT 1;`,
      args: [id],
    });
    const cat = res.rows[0] ? mapCategory(res.rows[0]) : null;
    if (!cat || cat.isDefault) return false;

    const name = updates.name !== undefined ? updates.name.trim() : cat.name;
    const icon = updates.icon !== undefined ? updates.icon : cat.icon;
    const color = updates.color !== undefined ? updates.color : cat.color;

    await this.client.execute({
      sql: `UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?;`,
      args: [name, icon, color, id],
    });
    return true;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM categories WHERE id = ? LIMIT 1;`,
      args: [id],
    });
    const cat = res.rows[0] ? mapCategory(res.rows[0]) : null;
    if (!cat || cat.isDefault) return false;

    const now = new Date().toISOString();
    // 1. Reassign all expenses to fallback 'cat-other'
    await this.client.execute({
      sql: `UPDATE expenses SET category_id = 'cat-other', updated_at = ? WHERE category_id = ?;`,
      args: [now, id],
    });

    // 2. Remove budgets for this category
    await this.client.execute({
      sql: `DELETE FROM budgets WHERE category_id = ?;`,
      args: [id],
    });

    // 3. Delete category
    await this.client.execute({
      sql: `DELETE FROM categories WHERE id = ?;`,
      args: [id],
    });

    return true;
  }

  // ── Budgets ───────────────────────────────────────────────────────────────

  async getBudgets(userId: string, month: string): Promise<DBBudget[]> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM budgets WHERE user_id = ? AND month = ?;`,
      args: [userId, month],
    });
    return res.rows.map(mapBudget);
  }

  async upsertBudget(
    userId: string,
    month: string,
    categoryId: string,
    amount: number,
    currency: string
  ): Promise<DBBudget> {
    await this.ready();
    const now = new Date().toISOString();
    const existingRes = await this.client.execute({
      sql: `SELECT id FROM budgets WHERE user_id = ? AND month = ? AND category_id = ? LIMIT 1;`,
      args: [userId, month, categoryId],
    });

    if (existingRes.rows.length > 0) {
      const id = String(existingRes.rows[0].id);
      await this.client.execute({
        sql: `UPDATE budgets SET amount = ?, currency = ?, updated_at = ? WHERE id = ?;`,
        args: [amount, currency, now, id],
      });
      return { id, userId, month, categoryId, amount, currency, createdAt: now, updatedAt: now };
    } else {
      const id = generateId();
      await this.client.execute({
        sql: `INSERT INTO budgets (id, user_id, month, category_id, amount, currency, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [id, userId, month, categoryId, amount, currency, now, now],
      });
      return { id, userId, month, categoryId, amount, currency, createdAt: now, updatedAt: now };
    }
  }

  async deleteBudget(id: string): Promise<boolean> {
    await this.ready();
    const res = await this.client.execute({
      sql: `DELETE FROM budgets WHERE id = ?;`,
      args: [id],
    });
    return res.rowsAffected > 0;
  }

  // ── Admin Security & Password ─────────────────────────────────────────────

  async getAdminPasswordHash(): Promise<string> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT value FROM system_config WHERE key = 'admin_password_hash' LIMIT 1;`,
    });
    if (res.rows[0]) return String(res.rows[0].value);
    return hashPassword('Admin@12345');
  }

  async setAdminPasswordHash(hash: string): Promise<void> {
    await this.ready();
    await this.client.execute({
      sql: `INSERT OR REPLACE INTO system_config (key, value) VALUES ('admin_password_hash', ?);`,
      args: [hash],
    });
  }

  async verifyAdminPassword(password: string): Promise<boolean> {
    const currentHash = await this.getAdminPasswordHash();
    return hashPassword(password) === currentHash;
  }

  async changeAdminPassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const isValid = await this.verifyAdminPassword(oldPassword);
    if (!isValid) {
      return { success: false, error: 'Current admin password is incorrect' };
    }
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }
    await this.setAdminPasswordHash(hashPassword(newPassword.trim()));
    return { success: true };
  }

  // ── Admin User Management ──────────────────────────────────────────────────

  async getAllUsersWithStats() {
    return this.getAdminUsers();
  }

  async deleteUserAccount(id: string) {
    return this.deleteUser(id);
  }

  async getAdminUsers(): Promise<
    (DBUser & { expenseCount: number; totalSpent: number; budgetCount: number; categoryCount: number })[]
  > {
    await this.ready();
    const usersRes = await this.client.execute(`SELECT * FROM users ORDER BY created_at DESC;`);
    const users = usersRes.rows.map(mapUser);

    const result = [];
    for (const u of users) {
      const expRes = await this.client.execute({
        sql: `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND is_deleted = 0;`,
        args: [u.id],
      });
      const budRes = await this.client.execute({
        sql: `SELECT COUNT(*) as count FROM budgets WHERE user_id = ?;`,
        args: [u.id],
      });
      const catRes = await this.client.execute({
        sql: `SELECT COUNT(*) as count FROM categories WHERE user_id = ?;`,
        args: [u.id],
      });

      result.push({
        ...u,
        expenseCount: Number(expRes.rows[0]?.count ?? 0),
        totalSpent: Number(expRes.rows[0]?.total ?? 0),
        budgetCount: Number(budRes.rows[0]?.count ?? 0),
        categoryCount: Number(catRes.rows[0]?.count ?? 0),
      });
    }

    return result;
  }

  async adminDeleteUser(userId: string): Promise<boolean> {
    return this.deleteUser(userId);
  }

  async adminUpdateUser(
    userId: string,
    updates: { name?: string; email?: string; currency?: string; newPassword?: string; isActive?: boolean }
  ): Promise<DBUser | undefined> {
    await this.ready();
    const existing = await this.findUserById(userId);
    if (!existing) return undefined;

    const name = updates.name !== undefined ? updates.name.trim() : existing.name;
    const email = updates.email !== undefined ? updates.email.toLowerCase().trim() : existing.email;
    const currency = updates.currency !== undefined ? updates.currency : existing.currency;
    const isActive = updates.isActive !== undefined ? updates.isActive : existing.isActive;
    const passwordHash = updates.newPassword && updates.newPassword.trim().length >= 6
      ? hashPassword(updates.newPassword.trim())
      : existing.passwordHash;
    const updatedAt = new Date().toISOString();

    await this.client.execute({
      sql: `UPDATE users
            SET name = ?, email = ?, currency = ?, is_active = ?, password_hash = ?, updated_at = ?
            WHERE id = ?;`,
      args: [name, email, currency, isActive ? 1 : 0, passwordHash, updatedAt, userId],
    });

    if (updates.currency) {
      await this.client.execute({
        sql: `UPDATE expenses SET currency = ? WHERE user_id = ?;`,
        args: [updates.currency, userId],
      });
      await this.client.execute({
        sql: `UPDATE budgets SET currency = ? WHERE user_id = ?;`,
        args: [updates.currency, userId],
      });
    }

    return {
      ...existing,
      name,
      email,
      currency,
      isActive,
      passwordHash,
      updatedAt,
    };
  }

  async getAdminSystemStats(): Promise<{
    totalUsers: number;
    totalExpenses: number;
    totalVolume: number;
    totalCategories: number;
    totalBudgets: number;
  }> {
    await this.ready();
    const [usersRes, expRes, catRes, budRes] = await Promise.all([
      this.client.execute(`SELECT COUNT(*) as count FROM users;`),
      this.client.execute(`SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM expenses WHERE is_deleted = 0;`),
      this.client.execute(`SELECT COUNT(*) as count FROM categories;`),
      this.client.execute(`SELECT COUNT(*) as count FROM budgets;`),
    ]);

    return {
      totalUsers: Number(usersRes.rows[0]?.count ?? 0),
      totalExpenses: Number(expRes.rows[0]?.count ?? 0),
      totalVolume: Number(expRes.rows[0]?.total ?? 0),
      totalCategories: Number(catRes.rows[0]?.count ?? 0),
      totalBudgets: Number(budRes.rows[0]?.count ?? 0),
    };
  }

  // ── Admin Default Categories Methods ─────────────────────────────────────

  async adminGetDefaultCategories(): Promise<(DBCategory & { expenseCount: number; budgetCount: number })[]> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM categories WHERE user_id = 'global' ORDER BY is_default DESC, name ASC;`,
    });
    const cats = res.rows.map(mapCategory);

    const result = [];
    for (const c of cats) {
      const expRes = await this.client.execute({
        sql: `SELECT COUNT(*) as count FROM expenses WHERE category_id = ? AND is_deleted = 0;`,
        args: [c.id],
      });
      const budRes = await this.client.execute({
        sql: `SELECT COUNT(*) as count FROM budgets WHERE category_id = ?;`,
        args: [c.id],
      });

      result.push({
        ...c,
        expenseCount: Number(expRes.rows[0]?.count ?? 0),
        budgetCount: Number(budRes.rows[0]?.count ?? 0),
      });
    }

    return result;
  }

  async adminCreateDefaultCategory(input: {
    name: string;
    icon: string;
    color: string;
    isActive?: boolean;
  }): Promise<DBCategory> {
    await this.ready();
    const now = new Date().toISOString();
    const id = 'cat-' + generateId();
    const isActive = input.isActive !== false;

    await this.client.execute({
      sql: `INSERT INTO categories (id, user_id, name, icon, color, is_default, is_active, created_at)
            VALUES (?, 'global', ?, ?, ?, 1, ?, ?);`,
      args: [id, input.name.trim(), input.icon || '🏷️', input.color || '#10b981', isActive ? 1 : 0, now],
    });

    return {
      id,
      userId: 'global',
      name: input.name.trim(),
      icon: input.icon || '🏷️',
      color: input.color || '#10b981',
      isDefault: true,
      isActive,
      createdAt: now,
    };
  }

  async adminUpdateDefaultCategory(
    id: string,
    updates: { name?: string; icon?: string; color?: string; isActive?: boolean }
  ): Promise<DBCategory | undefined> {
    await this.ready();
    const res = await this.client.execute({
      sql: `SELECT * FROM categories WHERE id = ? AND user_id = 'global' LIMIT 1;`,
      args: [id],
    });
    const cat = res.rows[0] ? mapCategory(res.rows[0]) : null;
    if (!cat) return undefined;

    const name = updates.name !== undefined ? updates.name.trim() : cat.name;
    const icon = updates.icon !== undefined ? updates.icon : cat.icon;
    const color = updates.color !== undefined ? updates.color : cat.color;
    const isActive = updates.isActive !== undefined ? updates.isActive : cat.isActive;

    await this.client.execute({
      sql: `UPDATE categories SET name = ?, icon = ?, color = ?, is_active = ? WHERE id = ?;`,
      args: [name, icon, color, isActive ? 1 : 0, id],
    });

    return {
      ...cat,
      name,
      icon,
      color,
      isActive,
    };
  }

  async adminDeleteDefaultCategory(id: string): Promise<{ success: boolean; error?: string }> {
    await this.ready();
    if (id === 'cat-other') {
      return { success: false, error: 'Cannot delete the fallback "Other" category. You can set it to Inactive instead.' };
    }

    const res = await this.client.execute({
      sql: `SELECT * FROM categories WHERE id = ? AND user_id = 'global' LIMIT 1;`,
      args: [id],
    });
    if (res.rows.length === 0) return { success: false, error: 'Category not found' };

    const now = new Date().toISOString();
    // 1. Reassign expenses to fallback 'cat-other'
    await this.client.execute({
      sql: `UPDATE expenses SET category_id = 'cat-other', updated_at = ? WHERE category_id = ?;`,
      args: [now, id],
    });

    // 2. Delete budgets
    await this.client.execute({
      sql: `DELETE FROM budgets WHERE category_id = ?;`,
      args: [id],
    });

    // 3. Delete category
    await this.client.execute({
      sql: `DELETE FROM categories WHERE id = ?;`,
      args: [id],
    });

    return { success: true };
  }
}

// ─── Export Database Instance Singleton ──────────────────────────────────────

declare global {
  var __penny_sqlite_db: PennyTrailSQLiteDB | undefined;
}

global.__penny_sqlite_db = global.__penny_sqlite_db || new PennyTrailSQLiteDB();
export const serverDb = global.__penny_sqlite_db;

import { db } from '../database';
import { AppUser } from '../schema';

// Simple hash for local-only auth (not for production server use)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'pennytrail-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const userRepository = {
  async create(data: { name: string; email: string; password: string; currency?: string }): Promise<AppUser> {
    const existing = await db.appUsers.where('email').equals(data.email.toLowerCase()).first();
    if (existing) throw new Error('An account with this email already exists.');

    const now = new Date().toISOString();
    const user: AppUser = {
      id: generateId(),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: await hashPassword(data.password),
      avatarEmoji: '💰',
      currency: data.currency ?? 'INR',
      role: 'USER',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.appUsers.add(user);
    return user;
  },

  async login(email: string, password: string): Promise<AppUser> {
    const user = await db.appUsers.where('email').equals(email.toLowerCase().trim()).first();
    if (!user) throw new Error('No account found with this email.');

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) throw new Error('Incorrect password.');
    if (!user.isActive) throw new Error('This account is inactive.');

    return user;
  },

  async getById(id: string): Promise<AppUser | undefined> {
    return db.appUsers.get(id);
  },

  async update(id: string, updates: Partial<Pick<AppUser, 'name' | 'avatarEmoji' | 'currency'>>): Promise<void> {
    await db.appUsers.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await db.appUsers.get(id);
    if (!user) throw new Error('User not found.');
    const oldHash = await hashPassword(oldPassword);
    if (oldHash !== user.passwordHash) throw new Error('Current password is incorrect.');
    const newHash = await hashPassword(newPassword);
    await db.appUsers.update(id, { passwordHash: newHash, updatedAt: new Date().toISOString() });
  },
};

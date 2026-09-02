'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppUser, apiClient } from '@/lib/api';

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: { name?: string; avatarEmoji?: string; currency?: string }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = 'pennytrail_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage (just the serialized user object)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const u = JSON.parse(stored) as AppUser;
        if (u?.id) setUser(u);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (u: AppUser | null) => {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiClient.auth.login(email, password);
    persist(u);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, currency?: string) => {
    const u = await apiClient.auth.register(name, email, password, currency);
    persist(u);
  }, []);

  const logout = useCallback(() => { persist(null); }, []);

  const updateProfile = useCallback(async (updates: { name?: string; avatarEmoji?: string; currency?: string }) => {
    if (!user) return;
    const updated = await apiClient.auth.updateProfile(user.id, updates);
    persist(updated);
  }, [user]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    if (!user) return;
    await apiClient.auth.changePassword(user.id, oldPassword, newPassword);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

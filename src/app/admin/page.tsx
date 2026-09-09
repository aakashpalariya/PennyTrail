'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  Key,
  LogOut,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Sun,
  Moon,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  FolderTree,
  Check,
  X,
  Power,
  Tag,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { formatAmount } from '@/domain/currency';
import { formatDate, formatDobDisplay } from '@/domain/formatters';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { LoadingSpinner } from '@/components/ui/Primitives';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  dob?: string;
  currency: string;
  avatarEmoji: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expenseCount: number;
  totalSpent: number;
  budgetCount: number;
  categoryCount: number;
}

interface AdminCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  expenseCount: number;
  budgetCount: number;
}

type AdminTab = 'users' | 'categories' | 'security';

const EMOJI_OPTIONS = [
  '🍽️','🚗','🛍️','💡','🏥','🎬','📚','🛒','✈️','📦',
  '💊','🎮','🏋️','🐾','🎁','🏠','📱','☕','🍕','🎵',
  '💇','🧴','🎓','🔧','🎪','🏖️','🎭','🌮','🚀','🏔️',
  '🎨','🖥️','🎹','🏊','🚴','🌿','💐','🎂','🍺','🧘',
  '🎯','💼','🔑','🌍','⚽','🏀','🎾','🎸','🎤','🛡️',
  '🍔','🍿','🍣','🍩','🍹','🚕','⛽','🏨','🎟️','🏷️',
];

const COLOR_OPTIONS = [
  '#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899',
  '#f43f5e','#e11d48','#b91c1c','#78716c','#6b7280','#0d9488','#0369a1','#7c3aed',
];

export default function AdminPage() {
  const { showToast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // User Management State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // User Modals & Actions
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editCurrency, setEditCurrency] = useState('INR');
  const [editPassword, setEditPassword] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editErrors, setEditErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addDob, setAddDob] = useState('2001-01-01');
  const [addPassword, setAddPassword] = useState('');
  const [addCurrency, setAddCurrency] = useState('INR');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [addErrors, setAddErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Category Modals & Actions
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCatName, setAddCatName] = useState('');
  const [addCatIcon, setAddCatIcon] = useState('🍽️');
  const [addCatColor, setAddCatColor] = useState('#10b981');
  const [addCatIsActive, setAddCatIsActive] = useState(true);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [addCatError, setAddCatError] = useState('');

  const [categoryEditTarget, setCategoryEditTarget] = useState<AdminCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('🍽️');
  const [editCatColor, setEditCatColor] = useState('#10b981');
  const [editCatIsActive, setEditCatIsActive] = useState(true);
  const [isSavingCategoryEdit, setIsSavingCategoryEdit] = useState(false);
  const [editCatError, setEditCatError] = useState('');

  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<AdminCategory | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Admin Change Password Form
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isChangingAdminPassword, setIsChangingAdminPassword] = useState(false);

  // Check existing session
  useEffect(() => {
    const isAuth = sessionStorage.getItem('pennytrail_admin_session') === 'true';
    setIsAdminAuthenticated(isAuth);
  }, []);

  // Fetch all admin data (Users + Default Categories)
  const loadAdminData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [usersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/categories'),
      ]);
      const usersJson = await usersRes.json();
      const categoriesJson = await categoriesRes.json();
      setUsers(usersJson.users ?? []);
      setCategories(categoriesJson.categories ?? []);
    } catch {
      showToast('Failed to load admin data', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAdminData();
    }
  }, [isAdminAuthenticated, loadAdminData]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput) {
      setLoginError('Please enter admin password');
      return;
    }
    setLoginError('');
    setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? 'Invalid admin password');
        return;
      }
      sessionStorage.setItem('pennytrail_admin_session', 'true');
      setIsAdminAuthenticated(true);
      setAdminPasswordInput('');
      showToast('Admin access granted', 'success');
    } catch {
      setLoginError('Authentication failed. Check your network.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('pennytrail_admin_session');
    setIsAdminAuthenticated(false);
    showToast('Logged out from admin console', 'info');
  };

  // ── USER HANDLERS ──────────────────────────────────────────────────────────

  const handleConfirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete user');
      showToast(`User account "${deleteTarget.name}" deleted`, 'info');
      setDeleteTarget(null);
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deletion failed';
      showToast(message, 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const openEditUser = (u: AdminUser) => {
    setEditTarget(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditDob(u.dob || '2001-01-01');
    setEditCurrency(u.currency || 'INR');
    setEditPassword('');
    setEditErrors({});
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    const errs: { name?: string; email?: string; password?: string } = {};
    const trimmedName = editName.trim();
    if (!trimmedName) {
      errs.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errs.name = 'Name must be at least 2 characters';
    } else if (/\d/.test(trimmedName)) {
      errs.name = 'Name should not contain numbers';
    }

    const trimmedEmail = editEmail.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (editPassword.trim()) {
      if (editPassword.trim().length < 6) {
        errs.password = 'Password must be at least 6 characters';
      }
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setEditErrors({});
    setIsSavingEdit(true);
    try {
      const payload: Record<string, string> = {
        name: trimmedName,
        email: trimmedEmail,
        dob: editDob || '2001-01-01',
        currency: editCurrency,
      };
      if (editPassword.trim()) {
        payload.newPassword = editPassword.trim();
      }
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && /email/i.test(data.error)) {
          setEditErrors(prev => ({ ...prev, email: data.error }));
        }
        throw new Error(data.error ?? 'Update failed');
      }
      showToast('User updated successfully', 'success');
      setEditTarget(null);
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      showToast(message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: { name?: string; email?: string; password?: string } = {};
    const trimmedName = addName.trim();
    if (!trimmedName) {
      errs.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errs.name = 'Name must be at least 2 characters';
    } else if (/\d/.test(trimmedName)) {
      errs.name = 'Name should not contain numbers';
    }

    const trimmedEmail = addEmail.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!addPassword) {
      errs.password = 'Password is required';
    } else if (addPassword.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errs).length > 0) {
      setAddErrors(errs);
      return;
    }

    setAddErrors({});
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: addPassword.trim(),
          dob: addDob || '2001-01-01',
          currency: addCurrency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && /email/i.test(data.error)) {
          setAddErrors(prev => ({ ...prev, email: data.error }));
        }
        throw new Error(data.error ?? 'Failed to create user');
      }
      showToast('New user created successfully!', 'success');
      setShowAddUserModal(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddErrors({});
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Creation failed';
      showToast(message, 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // ── CATEGORY HANDLERS ──────────────────────────────────────────────────────

  const handleToggleCategoryStatus = async (cat: AdminCategory) => {
    const newStatus = !cat.isActive;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to toggle status');
      showToast(`Category "${cat.name}" is now ${newStatus ? 'Active' : 'Inactive'}`, 'success');
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Toggle failed';
      showToast(message, 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCatName.trim()) {
      setAddCatError('Category name is required');
      return;
    }
    setAddCatError('');
    setIsCreatingCategory(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addCatName.trim(),
          icon: addCatIcon,
          color: addCatColor,
          isActive: addCatIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create category');
      showToast(`Default category "${addCatName}" created!`, 'success');
      setShowAddCategoryModal(false);
      setAddCatName('');
      setAddCatIcon('🍽️');
      setAddCatColor('#10b981');
      setAddCatIsActive(true);
      setAddCatError('');
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Creation failed';
      showToast(message, 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const openEditCategory = (cat: AdminCategory) => {
    setCategoryEditTarget(cat);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
    setEditCatColor(cat.color);
    setEditCatIsActive(cat.isActive);
    setEditCatError('');
  };

  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryEditTarget) return;
    if (!editCatName.trim()) {
      setEditCatError('Category name cannot be empty');
      return;
    }
    setEditCatError('');
    setIsSavingCategoryEdit(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: categoryEditTarget.id,
          name: editCatName.trim(),
          icon: editCatIcon,
          color: editCatColor,
          isActive: editCatIsActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update category');
      showToast(`Category "${editCatName}" updated successfully!`, 'success');
      setCategoryEditTarget(null);
      setEditCatError('');
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      showToast(message, 'error');
    } finally {
      setIsSavingCategoryEdit(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryDeleteTarget) return;
    setIsDeletingCategory(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(categoryDeleteTarget.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete category');
      showToast(`Category "${categoryDeleteTarget.name}" deleted`, 'info');
      setCategoryDeleteTarget(null);
      loadAdminData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deletion failed';
      showToast(message, 'error');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // ── SECURITY HANDLER ───────────────────────────────────────────────────────

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdminPassword || !newAdminPassword || !confirmAdminPassword) {
      showToast('Please fill all password fields', 'warning');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newAdminPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }
    setIsChangingAdminPassword(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: currentAdminPassword,
          newPassword: newAdminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to change password');
      showToast('Admin password successfully updated!', 'success');
      setCurrentAdminPassword('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      showToast(message, 'error');
    } finally {
      setIsChangingAdminPassword(false);
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(
    c => c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // 1. Loading screen before checking session
  if (isAdminAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  // 2. Admin Login Gate Screen (If not authenticated)
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto min-h-[75vh] flex flex-col justify-center animate-fade-in p-4">
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-2xl bg-white/95 dark:bg-neutral-900/95">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck size={36} strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              Admin Portal
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Password-protected manager console for PennyTrail
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPasswordInput}
                  onChange={e => {
                    setAdminPasswordInput(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="Enter administrator password..."
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginError && (
                <p className="text-xs text-red-500 font-semibold mt-1.5">{loginError}</p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isVerifying}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/25"
            >
              Access Admin Console
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to User Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Console Screen
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 sm:pb-12 max-w-5xl mx-auto">
      {/* Top Admin Navigation Header */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100">
                PennyTrail Admin
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Authorized
              </span>
            </div>
            <p className="text-xs text-neutral-400">User Management & Default Categories</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Go to App button */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Go to App
          </Link>

          {/* Refresh button */}
          <button
            type="button"
            onClick={loadAdminData}
            title="Refresh Data"
            disabled={isLoadingData}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} className={isLoadingData ? 'animate-spin' : ''} />
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {resolvedTheme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          {/* Logout Admin */}
          <button
            type="button"
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800">
        {/* Tab 1: Users */}
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
            activeTab === 'users'
              ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          )}
        >
          <Users size={16} /> Users ({users.length})
        </button>

        {/* Tab 2: Categories */}
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
            activeTab === 'categories'
              ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          )}
        >
          <FolderTree size={16} /> Categories ({categories.length})
        </button>

        {/* Tab 3: Security */}
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={cn(
            'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
            activeTab === 'security'
              ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          )}
        >
          <Key size={16} /> Security
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                leftElement={<Search size={15} />}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} /> Create User Account
            </button>
          </div>

          {/* User List */}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size={32} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-neutral-200/80 dark:border-neutral-800">
              <Users size={40} className="mx-auto text-neutral-400 mb-2 opacity-50" />
              <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">No users found</p>
              <p className="text-xs text-neutral-400 mt-1">Try another search term or create a new user account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  className="glass-card rounded-3xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  {/* User Profile Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar avatar={u.avatarEmoji} name={u.name} size="md" className="ring-2 ring-emerald-500/30 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{u.name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            {u.currency}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{u.email}</p>
                        {u.dob && (
                          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                            <Calendar size={12} /> DOB: {formatDobDisplay(u.dob)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditUser(u)}
                        title="Edit User / Reset Password"
                        className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u)}
                        title="Delete User Account"
                        className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* User Usage Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400">Transactions</p>
                      <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 mt-0.5">{u.expenseCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400">Total Spend</p>
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                        {formatAmount(u.totalSpent, u.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400">Joined</p>
                      <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mt-0.5 truncate">
                        {formatDate(u.createdAt.split('T')[0])}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEFAULT CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search default categories by name..."
                value={categorySearchQuery}
                onChange={e => setCategorySearchQuery(e.target.value)}
                leftElement={<Search size={15} />}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} /> Add Default Category
            </button>
          </div>

          {/* Categories Grid */}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size={32} />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-neutral-200/80 dark:border-neutral-800">
              <FolderTree size={40} className="mx-auto text-neutral-400 mb-2 opacity-50" />
              <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">No categories found</p>
              <p className="text-xs text-neutral-400 mt-1">Add a new default category or clear your search filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCategories.map(cat => (
                <div
                  key={cat.id}
                  className={cn(
                    'glass-card rounded-3xl p-4 sm:p-5 border shadow-xs flex flex-col justify-between gap-3.5 transition-all duration-200',
                    cat.isActive
                      ? 'border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90'
                      : 'border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 opacity-75'
                  )}
                >
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                        style={{ backgroundColor: `${cat.color}22` }}
                      >
                        {cat.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {cat.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                              cat.isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', cat.isActive ? 'bg-emerald-500' : 'bg-neutral-400')} />
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {cat.id === 'cat-other' && (
                            <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                              System Fallback
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditCategory(cat)}
                        title="Edit Category"
                        className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Edit2 size={15} />
                      </button>
                      {cat.id !== 'cat-other' && (
                        <button
                          type="button"
                          onClick={() => setCategoryDeleteTarget(cat)}
                          title="Delete Category"
                          className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usage Info & Quick Status Toggle */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 dark:border-neutral-800/60 text-xs">
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {cat.expenseCount} total expense{cat.expenseCount === 1 ? '' : 's'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleCategoryStatus(cat)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border',
                        cat.isActive
                          ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                      )}
                    >
                      <Power size={12} />
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN SECURITY */}
      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto w-full animate-fade-in">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col gap-5">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Key size={18} className="text-emerald-500" /> Change Administrator Password
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Update the password required to access this admin portal.
              </p>
            </div>

            <form onSubmit={handleChangeAdminPassword} className="flex flex-col gap-4">
              <Input
                label="Current Admin Password"
                type="password"
                placeholder="Enter current password..."
                value={currentAdminPassword}
                onChange={e => setCurrentAdminPassword(e.target.value)}
              />

              <Input
                label="New Admin Password"
                type="password"
                placeholder="Minimum 6 characters..."
                value={newAdminPassword}
                onChange={e => setNewAdminPassword(e.target.value)}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password..."
                value={confirmAdminPassword}
                onChange={e => setConfirmAdminPassword(e.target.value)}
              />

              <Button
                type="submit"
                size="md"
                isLoading={isChangingAdminPassword}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700"
              >
                Update Admin Password
              </Button>
            </form>

            <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Make sure to store your new password safely. If forgotten, it can also be reset from the server environment.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User Account?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Are you sure you want to permanently delete the account for <strong className="text-neutral-900 dark:text-neutral-100">&quot;{deleteTarget?.name}&quot;</strong> ({deleteTarget?.email})?
          </p>
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
            ⚠️ Warning: All expenses ({deleteTarget?.expenseCount}), budgets, and custom categories belonging to this user will be deleted permanently.
          </div>
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="danger"
              fullWidth
              isLoading={isDeletingUser}
              onClick={handleConfirmDeleteUser}
            >
              Delete User Account
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => {
          setEditTarget(null);
          setEditErrors({});
        }}
        title="Edit User Account"
        size="md"
      >
        <form onSubmit={handleSaveUserEdit} noValidate className="flex flex-col gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={editName}
            onChange={e => {
              setEditName(e.target.value);
              if (editErrors.name) setEditErrors(prev => ({ ...prev, name: undefined }));
            }}
            error={editErrors.name}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. user@example.com"
            value={editEmail}
            onChange={e => {
              setEditEmail(e.target.value);
              if (editErrors.email) setEditErrors(prev => ({ ...prev, email: undefined }));
            }}
            error={editErrors.email}
          />

          <Input
            label="Date of Birth"
            type="date"
            value={editDob}
            onChange={e => setEditDob(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Currency
            </label>
            <CustomSelect
              options={[
                { value: 'INR', label: '₹ INR — Indian Rupee' },
                { value: 'USD', label: '$ USD — US Dollar' },
                { value: 'EUR', label: '€ EUR — Euro' },
                { value: 'GBP', label: '£ GBP — British Pound' },
                { value: 'JPY', label: '¥ JPY — Japanese Yen' },
              ]}
              value={editCurrency}
              onChange={val => setEditCurrency(val)}
            />
          </div>

          <Input
            label="Reset User Password (Optional)"
            type="password"
            placeholder="Leave blank to keep unchanged..."
            value={editPassword}
            onChange={e => {
              setEditPassword(e.target.value);
              if (editErrors.password) setEditErrors(prev => ({ ...prev, password: undefined }));
            }}
            error={editErrors.password}
            helperText="Enter at least 6 characters to override password"
          />

          <div className="flex gap-2.5 pt-3">
            <Button
              type="submit"
              fullWidth
              isLoading={isSavingEdit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => {
                setEditTarget(null);
                setEditErrors({});
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setAddErrors({});
        }}
        title="Create New User"
        size="md"
      >
        <form onSubmit={handleCreateUser} noValidate className="flex flex-col gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={addName}
            onChange={e => {
              setAddName(e.target.value);
              if (addErrors.name) setAddErrors(prev => ({ ...prev, name: undefined }));
            }}
            error={addErrors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. user@example.com"
            value={addEmail}
            onChange={e => {
              setAddEmail(e.target.value);
              if (addErrors.email) setAddErrors(prev => ({ ...prev, email: undefined }));
            }}
            error={addErrors.email}
            required
          />

          <Input
            label="Date of Birth"
            type="date"
            value={addDob}
            onChange={e => setAddDob(e.target.value)}
            required
          />

          <Input
            label="Initial Password"
            type="password"
            placeholder="Minimum 6 characters..."
            value={addPassword}
            onChange={e => {
              setAddPassword(e.target.value);
              if (addErrors.password) setAddErrors(prev => ({ ...prev, password: undefined }));
            }}
            error={addErrors.password}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Currency
            </label>
            <CustomSelect
              options={[
                { value: 'INR', label: '₹ INR — Indian Rupee' },
                { value: 'USD', label: '$ USD — US Dollar' },
                { value: 'EUR', label: '€ EUR — Euro' },
                { value: 'GBP', label: '£ GBP — British Pound' },
                { value: 'JPY', label: '¥ JPY — Japanese Yen' },
              ]}
              value={addCurrency}
              onChange={val => setAddCurrency(val)}
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button
              type="submit"
              fullWidth
              isLoading={isCreatingUser}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Account
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => {
                setShowAddUserModal(false);
                setAddErrors({});
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Default Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => {
          setShowAddCategoryModal(false);
          setAddCatError('');
        }}
        title="Add Default Category"
        size="lg"
      >
        <form onSubmit={handleCreateCategory} noValidate className="flex flex-col gap-4">
          {/* Live Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
              style={{ backgroundColor: `${addCatColor}25` }}
            >
              {addCatIcon}
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-semibold">Live Preview</p>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {addCatName || 'Category Name'}
              </p>
            </div>
          </div>

          <Input
            label="Category Name"
            placeholder="e.g. Subscriptions, Groceries..."
            value={addCatName}
            onChange={e => {
              setAddCatName(e.target.value);
              if (addCatError) setAddCatError('');
            }}
            error={addCatError}
            required
            autoFocus
          />

          {/* Emoji Picker Grid (6 on mobile, 10 on desktop) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Select Icon ({EMOJI_OPTIONS.length})
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 max-h-48 overflow-y-auto justify-items-center">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAddCatIcon(emoji)}
                  className={cn(
                    'h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all cursor-pointer',
                    addCatIcon === emoji
                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110'
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker Palette (8 on mobile, 12 on desktop, centered) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Select Color ({COLOR_OPTIONS.length})
            </label>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 justify-items-center">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAddCatColor(c)}
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all cursor-pointer flex items-center justify-center',
                    addCatColor === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                >
                  {addCatColor === c && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Category Active Status</p>
              <p className="text-[11px] text-neutral-400">Active categories are visible to all users</p>
            </div>
            <button
              type="button"
              onClick={() => setAddCatIsActive(!addCatIsActive)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                addCatIsActive ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  addCatIsActive ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="submit"
              fullWidth
              isLoading={isCreatingCategory}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Default Category
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setShowAddCategoryModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Default Category Modal */}
      <Modal
        isOpen={!!categoryEditTarget}
        onClose={() => {
          setCategoryEditTarget(null);
          setEditCatError('');
        }}
        title="Edit Default Category"
        size="lg"
      >
        <form onSubmit={handleSaveCategoryEdit} noValidate className="flex flex-col gap-4">
          {/* Live Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
              style={{ backgroundColor: `${editCatColor}25` }}
            >
              {editCatIcon}
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-semibold">Live Preview</p>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {editCatName || 'Category Name'}
              </p>
            </div>
          </div>

          <Input
            label="Category Name"
            placeholder="e.g. Subscriptions, Groceries..."
            value={editCatName}
            onChange={e => {
              setEditCatName(e.target.value);
              if (editCatError) setEditCatError('');
            }}
            error={editCatError}
            required
          />

          {/* Emoji Picker Grid (6 on mobile, 10 on desktop) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Select Icon ({EMOJI_OPTIONS.length})
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 max-h-48 overflow-y-auto justify-items-center">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setEditCatIcon(emoji)}
                  className={cn(
                    'h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all cursor-pointer',
                    editCatIcon === emoji
                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-110'
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker Palette (8 on mobile, 12 on desktop, centered) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Select Color ({COLOR_OPTIONS.length})
            </label>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 justify-items-center">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditCatColor(c)}
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all cursor-pointer flex items-center justify-center',
                    editCatColor === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                >
                  {editCatColor === c && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Category Active Status</p>
              <p className="text-[11px] text-neutral-400">Active categories are visible to all users</p>
            </div>
            <button
              type="button"
              onClick={() => setEditCatIsActive(!editCatIsActive)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                editCatIsActive ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  editCatIsActive ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="submit"
              fullWidth
              isLoading={isSavingCategoryEdit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => setCategoryEditTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={!!categoryDeleteTarget}
        onClose={() => setCategoryDeleteTarget(null)}
        title="Delete Default Category?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${categoryDeleteTarget?.color}22` }}
            >
              {categoryDeleteTarget?.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {categoryDeleteTarget?.name}
              </p>
              <p className="text-xs text-neutral-400">
                {categoryDeleteTarget?.expenseCount} linked expenses
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <p className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="shrink-0" /> Expense Safety Guarantee:
            </p>
            <p className="mt-1 font-normal">
              Any user expenses currently filed under &quot;{categoryDeleteTarget?.name}&quot; will automatically be reassigned to the &quot;Other&quot; category so no financial records are lost.
            </p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="danger"
              fullWidth
              isLoading={isDeletingCategory}
              onClick={handleConfirmDeleteCategory}
            >
              Delete Category
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setCategoryDeleteTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

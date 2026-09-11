'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  User,
  Lock,
  Download,
  Trash2,
  Shield,
  ShieldCheck,
  Palette,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarPickerModal } from '@/components/ui/AvatarPickerModal';
import { PageHeader } from '@/components/ui/Primitives';
import { PwaInstallBanner } from '@/components/layout/PwaInstallBanner';
import { SUPPORTED_CURRENCIES } from '@/domain/currency';

export default function SettingsPage() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  // Profile Form
  const [name, setName] = useState(user?.name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'INR');
  const [avatar, setAvatar] = useState(user?.avatarEmoji ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setCurrency(user.currency);
      setAvatar(user.avatarEmoji ?? '');
    }
  }, [user]);

  const handleSelectAvatar = async (chosen: string) => {
    setAvatar(chosen);
    try {
      await updateProfile({ avatarEmoji: chosen });
      showToast('Profile avatar updated!', 'success');
    } catch {
      showToast('Failed to save avatar', 'error');
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatar('');
    try {
      await updateProfile({ avatarEmoji: '' });
      showToast('Profile avatar removed', 'info');
    } catch {
      showToast('Failed to remove avatar', 'error');
    }
  };

  // Password Form
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  // Confirmation Modals
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setIsSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), currency, avatarEmoji: avatar });
      showToast('Profile updated successfully!', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) return;
    if (newPwd.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    setIsSavingPwd(true);
    try {
      await changePassword(oldPwd, newPwd);
      showToast('Password changed successfully!', 'success');
      setOldPwd('');
      setNewPwd('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setIsSavingPwd(false);
    }
  };

  const handleBackup = async () => {
    if (!user) return;
    try {
      const [expenses, categories] = await Promise.all([
        apiClient.expenses.getAll(user.id),
        apiClient.categories.getAll(user.id),
      ]);
      const backup = {
        version: 2,
        exportedAt: new Date().toISOString(),
        user: { name: user.name, email: user.email, currency: user.currency },
        expenses,
        categories,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pennytrail_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup JSON downloaded!', 'success');
    } catch {
      showToast('Backup failed', 'error');
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    try {
      const expenses = await apiClient.expenses.getAll(user.id);
      for (const e of expenses) {
        await apiClient.expenses.softDelete(e.id);
      }
      showToast('All expense records cleared', 'info');
      setShowClearConfirm(false);
    } catch {
      showToast('Failed to clear records', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, display preferences, and account security"
      />

      {/* PWA Install Banner — Mobile view only */}
      <PwaInstallBanner />

      {/* Profile Card */}
      <section className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-5 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">Your Profile</h2>
            <p className="text-[11px] text-neutral-400">Personalize your character and display name</p>
          </div>
        </div>

        {/* Avatar trigger */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="group relative focus:outline-none cursor-pointer"
          >
            <Avatar avatar={avatar} name={name} size="xl" className="ring-2 ring-emerald-500/50 group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
              Edit
            </div>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{user.name}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} /> {avatar ? 'Change Avatar' : 'Choose Avatar'}
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={11} /> Remove Avatar
                </button>
              )}
            </div>
          </div>
        </div>

        <Input
          label="Display Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Aakash"
        />

        <CustomSelect
          label="Default Currency"
          value={currency}
          onChange={val => setCurrency(val)}
          options={SUPPORTED_CURRENCIES.map(c => ({
            value: c.code,
            label: `${c.name} (${c.symbol})`,
            sublabel: c.code,
          }))}
        />

        <Button
          onClick={handleSaveProfile}
          isLoading={isSavingProfile}
          className="self-start mt-1"
        >
          Save Changes
        </Button>
      </section>

      {/* Appearance Theme */}
      <section className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Palette size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">Appearance</h2>
            <p className="text-[11px] text-neutral-400">Choose your favorite visual theme</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { value: 'light', label: 'Light', Icon: Sun },
            { value: 'dark', label: 'Dark', Icon: Moon },
            { value: 'system', label: 'System', Icon: Monitor },
          ].map(({ value, label, Icon }) => {
            const isSelected = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                className={`flex flex-col items-center gap-2 py-3.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-xs ring-2 ring-emerald-400/30'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white/50 dark:bg-neutral-900/50'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Security: Change Password */}
      <section className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">Security</h2>
            <p className="text-[11px] text-neutral-400">Update your account password</p>
          </div>
        </div>

        <Input
          label="Current Password"
          type="password"
          value={oldPwd}
          onChange={e => setOldPwd(e.target.value)}
          placeholder="••••••••"
        />

        <Input
          label="New Password"
          type="password"
          value={newPwd}
          onChange={e => setNewPwd(e.target.value)}
          placeholder="At least 6 characters"
        />

        <Button
          onClick={handleChangePassword}
          isLoading={isSavingPwd}
          variant="outline"
          className="self-start mt-1"
        >
          Update Password
        </Button>
      </section>

      {/* Data & Backup */}
      <section className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-3 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">Data Management</h2>
            <p className="text-[11px] text-neutral-400">Export or clear your expense entries</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBackup}
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            <Download size={18} className="text-emerald-500" />
            <span>Download JSON Backup</span>
          </div>
          <ChevronRight size={16} className="text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/60 dark:border-red-900/60 transition-colors cursor-pointer text-red-600 dark:text-red-400"
        >
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Trash2 size={18} />
            <span>Clear Expense Records</span>
          </div>
          <ChevronRight size={16} className="text-red-400" />
        </button>
      </section>

      {/* Logout Button */}
      <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="flex items-center justify-center gap-2.5 px-6 py-3.5 glass-card rounded-2xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 transition-all cursor-pointer active:scale-98 shadow-xs"
      >
        <LogOut size={18} />
        <span>Sign Out of Account</span>
      </button>

      {/* Cartoon Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        currentAvatar={avatar}
        onSelect={handleSelectAvatar}
        onRemove={handleRemoveAvatar}
      />

      {/* Clear Confirmation Modal */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Expenses?">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
          This will delete your recorded expenses. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleClearData} fullWidth>
            Yes, Clear All
          </Button>
          <Button variant="ghost" onClick={() => setShowClearConfirm(false)} fullWidth>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Sign Out?">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
          You can sign back in anytime using your email and password.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleLogout} fullWidth>
            Sign Out
          </Button>
          <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)} fullWidth>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

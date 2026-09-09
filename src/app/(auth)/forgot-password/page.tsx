'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Calendar, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    dob?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const errs: {
      email?: string;
      dob?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!email.trim()) {
      errs.email = 'Please enter your account email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!dob) {
      errs.dob = 'Please select your Date of Birth';
    }

    if (!newPassword) {
      errs.newPassword = 'Please enter a new password';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters';
    }

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    setIsLoading(true);
    try {
      await apiClient.auth.resetPassword(email, dob, newPassword);
      setIsSuccess(true);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Reset password failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[var(--background)]">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="PennyTrail" className="w-16 h-16 object-contain mb-3" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">PennyTrail</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Reset your account password</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass-card rounded-2xl p-6 sm:p-7 shadow-xl border border-neutral-200/80 dark:border-neutral-800">
        {isSuccess ? (
          <div className="flex flex-col items-center text-center py-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Password Reset Complete
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Your password has been successfully updated. You can now log in using your new password.
            </p>
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={() => router.push('/login')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Sign In Now
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <KeyRound size={20} />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Forgot Password</h2>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                error={errors.email}
                leftElement={<Mail size={16} />}
                autoComplete="email"
              />

              <Input
                label="Date of Birth (Security verification)"
                type="date"
                value={dob}
                onChange={e => {
                  setDob(e.target.value);
                  if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                }}
                error={errors.dob}
                leftElement={<Calendar size={16} />}
              />

              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
                }}
                error={errors.newPassword}
                leftElement={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                autoComplete="new-password"
              />

              <Input
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                error={errors.confirmPassword}
                leftElement={<Lock size={16} />}
                autoComplete="new-password"
              />

              {errors.general && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
                  {errors.general}
                </div>
              )}

              <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-2">
                Reset Password
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

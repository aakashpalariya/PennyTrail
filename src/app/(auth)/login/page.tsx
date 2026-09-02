'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // 5-Tap Admin Secret Trigger
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastTapTime > 2500) {
      setLogoTapCount(1);
      setLastTapTime(now);
    } else {
      const newCount = logoTapCount + 1;
      setLogoTapCount(newCount);
      setLastTapTime(now);
      if (newCount >= 5) {
        setLogoTapCount(0);
        router.push('/admin');
      }
    }
  };

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Please enter your password';
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
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-[var(--background)]">
      {/* Brand with 5-tap Admin Portal Secret Trigger */}
      <div className="flex flex-col items-center mb-8 select-none">
        <button
          type="button"
          onClick={handleLogoClick}
          className="focus:outline-none cursor-pointer transition-transform active:scale-90"
          title="PennyTrail"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PennyTrail" className="w-16 h-16 object-contain mb-3" />
        </button>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">PennyTrail</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Your personal expense journal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass-card rounded-2xl p-6 sm:p-7 shadow-xl border border-neutral-200/80 dark:border-neutral-800">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-5">Welcome back</h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
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
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
            }}
            error={errors.password}
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
            autoComplete="current-password"
          />

          {errors.general && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {errors.general}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-2">
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

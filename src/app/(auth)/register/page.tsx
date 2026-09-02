'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SUPPORTED_CURRENCIES } from '@/domain/currency';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) {
      errs.name = 'Please enter your name';
    }
    if (!email.trim()) {
      errs.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Please enter a password';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
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
      await register(name, email, password, currency);
      router.replace('/dashboard');
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Registration failed' });
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
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Start tracking your expenses</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass-card rounded-2xl p-6 sm:p-7 shadow-xl border border-neutral-200/80 dark:border-neutral-800">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-5">Create Account</h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="Aakash Sharma"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            leftElement={<User size={16} />}
          />

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
            placeholder="At least 6 characters"
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
            autoComplete="new-password"
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

          {errors.general && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {errors.general}
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-2">
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

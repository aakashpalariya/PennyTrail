'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

export function AppHeader() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  // Don't show header if not logged in
  if (!user) return null;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="hidden lg:block sticky top-0 z-40 w-full bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Title on Desktop */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group focus:outline-none shrink-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-emerald-500/15 group-hover:scale-105 transition-transform bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="PennyTrail"
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div className="block">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Penny<span className="text-emerald-500 dark:text-emerald-400">Trail</span>
            </span>
          </div>
        </Link>

        {/* Right Actions: Direct Theme Toggle + Profile Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Direct Light / Dark Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer text-neutral-700 dark:text-neutral-200"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-neutral-700" />
            )}
          </button>

          {/* User Profile Avatar Link to /settings */}
          <Link
            href="/settings"
            title={`Logged in as ${user.name}`}
            className="flex items-center gap-2.5 p-1 px-2.5 py-1.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all cursor-pointer bg-white dark:bg-neutral-900 shadow-xs hover:scale-105 active:scale-95"
          >
            <Avatar avatar={user.avatarEmoji} name={user.name} size="sm" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[120px]">
              {user.name}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

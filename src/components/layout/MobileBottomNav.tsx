'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  List,
  Plus,
  Grid,
  BarChart2,
  Wallet,
  Tag,
  Calendar,
  FileSpreadsheet,
  Settings,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from '@/components/ui/Avatar';

// All 8 Sidebar Navigation Items
const ALL_MENU_ITEMS = [
  { icon: Home,            label: 'Dashboard',  href: '/dashboard',  color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  { icon: List,            label: 'Expenses',   href: '/expenses',   color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
  { icon: BarChart2,       label: 'Analytics',  href: '/analytics',  color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
  { icon: Wallet,          label: 'Budget',     href: '/budget',     color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
  { icon: Tag,             label: 'Categories', href: '/categories', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
  { icon: Calendar,        label: 'Calendar',   href: '/calendar',   color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800' },
  { icon: FileSpreadsheet, label: 'Reports',    href: '/reports',    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' },
  { icon: Settings,        label: 'Settings',   href: '/settings',   color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render only when logged in
  if (!user) return null;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const drawerElement = isMoreOpen && mounted ? (
    <div className="fixed inset-0 z-[100] lg:hidden flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={() => setIsMoreOpen(false)}
      />

      {/* Bottom Sheet Modal */}
      <div className="relative w-full max-h-[88vh] bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl shadow-2xl z-10 flex flex-col overflow-hidden pb-safe">
        {/* Drag Indicator */}
        <div className="w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Menu & Features
            </h3>
            <p className="text-[11px] text-neutral-400">All 8 sections of PennyTrail</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMoreOpen(false)}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 8 Side Menu Items Grid (4 in a row × 2 rows, full labels without ellipsis) */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {ALL_MENU_ITEMS.map(({ icon: Icon, label, href, color }) => {
              const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer text-center group active:scale-95 min-h-[76px]',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-400/30'
                      : 'border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 hover:border-emerald-300 dark:hover:border-emerald-700'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-xs border shrink-0', color)}>
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    'text-[10px] sm:text-[11px] font-bold leading-tight text-center w-full whitespace-normal break-words px-0.5',
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-neutral-700 dark:text-neutral-300'
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Theme Switcher Row in Bottom Drawer */}
          <div className="mt-3.5 flex items-center justify-between p-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60">
            <div className="flex items-center gap-2.5">
              {resolvedTheme === 'dark' ? <Moon size={18} className="text-amber-400" /> : <Sun size={18} className="text-amber-500" />}
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Theme: {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 shadow-xs cursor-pointer active:scale-95"
            >
              Toggle
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="glass-card border-t border-neutral-200/90 dark:border-neutral-800/90 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl shadow-2xl pb-safe">
          <div className="flex items-center justify-between px-3.5 py-2">
            {/* Left: App Logo & PennyTrail Text */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 focus:outline-none shrink-0"
            >
              <div className="w-7.5 h-7.5 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="PennyTrail"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                Penny<span className="text-emerald-500 dark:text-emerald-400">Trail</span>
              </span>
            </Link>

            {/* Right: Add Expense Button + More Drawer + Profile Avatar */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Add Expense Button */}
              <Link
                href="/expenses/add"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-transform cursor-pointer"
              >
                <Plus size={15} strokeWidth={3} />
                <span>Add</span>
              </Link>

              {/* More Menu Button */}
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold',
                  isMoreOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                )}
              >
                <Grid size={15} strokeWidth={2.5} />
                <span>More</span>
              </button>

              {/* Profile Avatar Button */}
              <Link
                href="/settings"
                title="Profile"
                className={cn(
                  'p-0.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center shrink-0',
                  pathname === '/settings'
                    ? 'border-emerald-500 ring-2 ring-emerald-400/40'
                    : 'border-neutral-200/80 dark:border-neutral-800'
                )}
              >
                <Avatar avatar={user.avatarEmoji} name={user.name} size="sm" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Render Drawer into document.body */}
      {drawerElement && typeof document !== 'undefined' ? createPortal(drawerElement, document.body) : null}
    </>
  );
}

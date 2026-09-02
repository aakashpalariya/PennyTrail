'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, List, Plus, BarChart2, Settings,
  Wallet, Calendar, FileSpreadsheet, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { icon: Home,            label: 'Dashboard',  href: '/dashboard' },
  { icon: List,            label: 'Expenses',   href: '/expenses' },
  { icon: BarChart2,       label: 'Analytics',  href: '/analytics' },
  { icon: Wallet,          label: 'Budget',     href: '/budget' },
  { icon: Tag,             label: 'Categories', href: '/categories' },
  { icon: Calendar,        label: 'Calendar',   href: '/calendar' },
  { icon: FileSpreadsheet, label: 'Reports',    href: '/reports' },
  { icon: Settings,        label: 'Settings',   href: '/settings' },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-[calc(100vh-4rem)] border-r border-neutral-200/80 dark:border-neutral-800/80 py-6 px-3.5 gap-1 bg-neutral-50/50 dark:bg-neutral-950/50">
      {/* Quick Add Expense Button */}
      <Link
        href="/expenses/add"
        className="flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.5} />
        Add Expense
      </Link>

      {/* Nav items */}
      <div className="space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

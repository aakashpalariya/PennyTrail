'use client';

import React from 'react';
import { cn } from '@/lib/utils';
export { CustomSelect as Select } from './CustomSelect';

type BadgeVariant = 'neutral' | 'emerald' | 'blue' | 'purple' | 'amber' | 'red';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  color?: string; // hex or tailwind color
  className?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  neutral:
    'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60',
  emerald:
    'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
  blue:
    'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60',
  purple:
    'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
  amber:
    'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
  red:
    'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800/60',
};

const dotColors: Record<BadgeVariant, string> = {
  neutral: 'bg-neutral-400',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function Badge({
  children,
  variant = 'neutral',
  color,
  className,
  size = 'sm',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full select-none shrink-0 transition-colors',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm',
        !color && badgeVariants[variant],
        className
      )}
      style={color ? { backgroundColor: color + '20', color, borderColor: color + '40', borderWidth: '1px' } : undefined}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', !color && dotColors[variant])}
          style={color ? { backgroundColor: color } : undefined}
        />
      )}
      {children}
    </span>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  backButton,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {backButton}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: 'up' | 'down';
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function StatCard({
  label,
  value,
  sub,
  trend,
  color = 'emerald',
  icon: Icon,
  className,
}: StatCardProps) {
  const colorStyles = {
    emerald: {
      card: 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/20 dark:border-emerald-500/20 hover:border-emerald-500/40',
      badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      val: 'text-emerald-950 dark:text-emerald-100',
    },
    blue: {
      card: 'bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 dark:border-blue-500/20 hover:border-blue-500/40',
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      val: 'text-blue-950 dark:text-blue-100',
    },
    amber: {
      card: 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 dark:border-amber-500/20 hover:border-amber-500/40',
      badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      val: 'text-amber-950 dark:text-amber-100',
    },
    purple: {
      card: 'bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/20 dark:border-purple-500/20 hover:border-purple-500/40',
      badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
      val: 'text-purple-950 dark:text-purple-100',
    },
    rose: {
      card: 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/20 dark:border-rose-500/20 hover:border-rose-500/40',
      badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      val: 'text-rose-950 dark:text-rose-100',
    },
    neutral: {
      card: 'bg-neutral-500/5 dark:bg-neutral-900/40 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700',
      badge: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
      val: 'text-neutral-900 dark:text-neutral-100',
    },
  }[color];

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-sm',
        colorStyles.card,
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 truncate">
            {label}
          </p>
          {Icon && (
            <div className={cn('w-7.5 h-7.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs', colorStyles.badge)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className={cn('text-xl sm:text-2xl font-bold tracking-tight', colorStyles.val)}>
          {value}
        </div>
      </div>

      {sub && (
        <div className="flex items-start gap-1.5 mt-2.5 pt-2 border-t border-black/5 dark:border-white/5">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-snug whitespace-normal break-words flex-1">
            {sub}
          </p>
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 sm:py-16 px-6 text-center glass-card rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs', className)}>
      {icon && <div className="text-4xl sm:text-5xl mb-3.5 select-none">{icon}</div>}
      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">{title}</h3>
      {description && <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn('animate-spin text-emerald-500', className)}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}


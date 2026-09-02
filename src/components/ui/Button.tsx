'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'danger-ghost';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20 hover:shadow-sm',
  secondary:
    'bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200/80 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
  ghost:
    'hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200/70 dark:active:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
  danger:
    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-xs shadow-red-500/20',
  'danger-ghost':
    'text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 active:bg-red-100 dark:active:bg-red-900/50',
  outline:
    'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5 min-h-[34px]',
  md: 'px-4 py-2 text-sm font-semibold rounded-xl gap-2 min-h-[40px]',
  lg: 'px-5 py-2.5 text-sm sm:text-base font-semibold rounded-xl gap-2.5 min-h-[44px]',
  icon: 'w-9 h-9 p-0 rounded-xl justify-center shrink-0',
  'icon-sm': 'w-7.5 h-7.5 p-0 rounded-lg justify-center shrink-0 text-xs',
};

export function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}


'use client';

import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, leftElement, rightElement, id, type, onClick, ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    const finalLeft = leftIcon || leftElement;
    const finalRight = rightIcon || rightElement;

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      if (type === 'date') {
        try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* ignore */ }
      }
      onClick?.(e);
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {finalLeft && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
              {finalLeft}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            onClick={handleClick}
            className={cn(
              'w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 min-h-[44px]',
              type === 'date' && 'cursor-pointer',
              finalLeft && 'pl-10',
              finalRight && 'pr-10',
              error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
              className
            )}
            {...props}
          />
          {finalRight && (
            <div className="absolute right-3.5 flex items-center text-neutral-400 dark:text-neutral-500">
              {finalRight}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-neutral-500 dark:text-neutral-400">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const defaultId = useId();
  const inputId = id || defaultId;
  return (
    <div className="w-full space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">{label}</label>}
      <textarea
        id={inputId}
        className={cn(
          'w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 resize-none',
          error && 'border-red-500',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

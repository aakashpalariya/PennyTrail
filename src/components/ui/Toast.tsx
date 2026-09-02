'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast, Toast as ToastType } from '@/context/ToastContext';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorClasses = {
  success: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200',
  error:   'border-red-500/30   bg-red-50   dark:bg-red-950/40   text-red-800   dark:text-red-200',
  info:    'border-blue-500/30  bg-blue-50  dark:bg-blue-950/40  text-blue-800  dark:text-blue-200',
  warning: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200',
};

const iconColorClasses = {
  success: 'text-emerald-500',
  error:   'text-red-500',
  info:    'text-blue-500',
  warning: 'text-amber-500',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { dismissToast } = useToast();
  const Icon = icons[toast.type];

  return (
    <div className={cn(
      'flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-xl border shadow-lg animate-fade-in',
      colorClasses[toast.type]
    )}>
      <Icon size={18} className={cn('mt-0.5 shrink-0', iconColorClasses[toast.type])} />
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <div className="flex items-center gap-2 shrink-0">
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); dismissToast(toast.id); }}
            className="text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            {toast.action.label}
          </button>
        )}
        <button onClick={() => dismissToast(toast.id)} className="opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none lg:bottom-6 lg:items-end lg:right-6 lg:left-auto">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full max-w-sm">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function TableContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-xs',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Table({
  children,
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn('w-full border-collapse text-left text-sm', className)}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-neutral-50/90 dark:bg-neutral-950/60 border-b border-neutral-200/80 dark:border-neutral-800',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-neutral-100 dark:divide-neutral-800/60', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        'bg-neutral-50/90 dark:bg-neutral-950/60 border-t-2 border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100',
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
}

export function TableRow({
  children,
  className,
  clickable = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }) {
  return (
    <tr
      className={cn(
        'transition-colors',
        clickable
          ? 'hover:bg-neutral-50/90 dark:hover:bg-neutral-800/60 cursor-pointer active:bg-neutral-100 dark:active:bg-neutral-800'
          : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
  align = 'left',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'center' | 'right';
}) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th
      className={cn(
        'py-3 px-3.5 sm:px-4 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 select-none whitespace-nowrap',
        alignClasses,
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  align = 'left',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'center' | 'right';
}) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td
      className={cn(
        'py-3 px-3.5 sm:px-4 text-sm text-neutral-800 dark:text-neutral-200 align-middle',
        alignClasses,
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

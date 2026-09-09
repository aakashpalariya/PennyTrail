import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { PaymentMethod } from '@/db/schema';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMM yyyy');
}

export function formatDobDisplay(dob?: string): string {
  if (!dob) return '';
  const clean = dob.trim();
  // Try YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM d, yyyy');
    }
  }
  // Try DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM d, yyyy');
    }
  }
  return clean;
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM');
}

export function formatMonth(month: string): string {
  // month = 'YYYY-MM'
  return format(parseISO(`${month}-01`), 'MMMM yyyy');
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function currentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  NET_BANKING: 'Net Banking',
  OTHER: 'Other',
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  CASH: '💵',
  UPI: '📱',
  CARD: '💳',
  NET_BANKING: '🏦',
  OTHER: '🔄',
};

export function groupExpensesByDate<T extends { date: string }>(
  expenses: T[]
): { label: string; date: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const e of expenses) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: formatDate(date),
      items,
    }));
}

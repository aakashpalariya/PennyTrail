import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { PaymentMethod } from '@/db/schema';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMM yyyy');
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

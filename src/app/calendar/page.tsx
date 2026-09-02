'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient, type Expense } from '@/lib/api';
import { formatAmount } from '@/domain/currency';
import { LoadingSpinner, PageHeader, StatCard } from '@/components/ui/Primitives';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from 'date-fns';

export default function CalendarPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [viewDate, setViewDate] = useState(new Date());
  const [dayMap, setDayMap] = useState<Map<string, number>>(new Map());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [maxSpend, setMaxSpend] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadMonth = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const month = format(viewDate, 'yyyy-MM');
    const expenses = await apiClient.expenses.getForMonth(user.id, month);
    setMonthExpenses(expenses);
    
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
    setDayMap(map);
    const max = Math.max(...Array.from(map.values()), 1);
    setMaxSpend(max);
    setSelectedDay(null);
    setDayExpenses([]);
    setIsLoading(false);
  }, [user, viewDate]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) loadMonth();
  }, [user, authLoading, router, loadMonth]);

  const handleDayClick = async (dateStr: string) => {
    if (!user) return;
    setSelectedDay(dateStr);
    const exps = monthExpenses.filter(e => e.date === dateStr);
    setDayExpenses(exps.sort((a, b) => b.amount - a.amount));
  };

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    if (next <= new Date()) setViewDate(next);
  };

  if (authLoading || isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size={32} /></div>;
  if (!user) return null;

  const currency = user.currency;
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start); // 0 = Sun

  // Month total
  const monthTotal = Array.from(dayMap.values()).reduce((s, v) => s + v, 0);

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header with Month Navigation */}
      <PageHeader
        title="Calendar"
        subtitle="Daily expense timeline and spending intensity"
        actions={
          <div className="flex items-center gap-2 glass-card rounded-2xl px-3 py-1.5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-neutral-500 hover:text-emerald-500 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 min-w-[110px] text-center">
              {format(viewDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-neutral-500 hover:text-emerald-500 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      {/* Month Total Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Total for {format(viewDate, 'MMMM yyyy')}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 tabular-nums">
            {formatAmount(monthTotal, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-400 font-medium">
            {monthExpenses.length} transaction{monthExpenses.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="glass-card rounded-2xl p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding */}
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const spend = dayMap.get(dateStr) ?? 0;
            const intensity = spend > 0 ? spend / maxSpend : 0;
            const isSelected = selectedDay === dateStr;
            const isTodayDay = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                className={`relative flex flex-col items-center py-1.5 rounded-xl transition-all text-xs ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <span className={`font-medium ${isTodayDay ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {format(day, 'd')}
                </span>
                {spend > 0 && (
                  <span
                    className="w-5 h-1 rounded-full mt-0.5"
                    style={{ backgroundColor: `rgba(16, 185, 129, ${0.3 + intensity * 0.7})` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-neutral-400">Less</span>
        {[0.2, 0.4, 0.6, 0.8, 1.0].map(o => (
          <span key={o} className="w-4 h-2 rounded-sm" style={{ backgroundColor: `rgba(16,185,129,${o})` }} />
        ))}
        <span className="text-xs text-neutral-400">More</span>
      </div>

      {/* Selected day expenses */}
      {selectedDay && (
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            {format(parseISO(selectedDay), 'EEEE, d MMMM yyyy')}
            <span className="ml-2 text-emerald-600 dark:text-emerald-400">
              {formatAmount(dayMap.get(selectedDay) ?? 0, currency)}
            </span>
          </h2>
          {dayExpenses.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <p className="text-sm text-neutral-400">No expenses on this day</p>
              <Link href="/expenses/add" className="text-xs text-emerald-600 dark:text-emerald-400">+ Add expense</Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-50 dark:divide-neutral-800">
              {dayExpenses.map(e => (
                <Link key={e.id} href={`/expenses/${e.id}/edit`} className="flex items-center justify-between py-2.5 hover:opacity-80">
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{e.title}</p>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatAmount(e.amount, currency)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  label?: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function DatePicker({ label, value, onChange, required, error, disabled }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    try { return value ? parseISO(value) : new Date(); } catch { return new Date(); }
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedDate = value ? parseISO(value) : new Date();
  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });

  const formattedDisplay = value ? format(parseISO(value), 'dd MMM yyyy') : 'Select date';

  return (
    <div className="relative w-full space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer min-h-[44px] gap-2 text-left',
          isOpen
            ? 'ring-2 ring-emerald-500/50 border-emerald-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-700',
          error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn('truncate', value ? '' : 'text-neutral-400')}>{formattedDisplay}</span>
        <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Calendar popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 right-0 sm:right-auto sm:w-72 p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xl space-y-3">
          {/* Month header */}
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{format(currentMonth, 'MMMM yyyy')}</h4>
            <div className="flex items-center gap-1">
              <button type="button" onClick={e => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={e => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="py-1 text-[11px] font-bold text-neutral-400 dark:text-neutral-500">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {days.map(day => {
              const isSelected = value ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => { onChange(format(day, 'yyyy-MM-dd')); setIsOpen(false); }}
                  className={cn(
                    'h-9 w-full rounded-xl text-xs font-semibold flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/30 scale-105'
                      : isTodayDate
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800'
                      : isCurrentMonth
                      ? 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      : 'text-neutral-300 dark:text-neutral-600'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button type="button"
              onClick={() => { const now = new Date(); onChange(format(now, 'yyyy-MM-dd')); setCurrentMonth(now); setIsOpen(false); }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              Today
            </button>
            <button type="button" onClick={() => setIsOpen(false)}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              Close
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

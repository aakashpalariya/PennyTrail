'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  required,
  error,
  disabled,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn('relative w-full space-y-1.5', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer min-h-[44px]',
          isOpen
            ? 'ring-2 ring-emerald-500/50 border-emerald-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-700',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 ring-2 ring-red-500/50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {selectedOption?.icon}
          <div className="flex items-baseline gap-1.5 min-w-0 truncate">
            <span className="truncate">{selectedOption ? selectedOption.label : <span className="text-neutral-400">{placeholder}</span>}</span>
            {selectedOption?.sublabel && (
              <span className="text-[11px] text-neutral-400 font-normal truncate hidden sm:inline">({selectedOption.sublabel})</span>
            )}
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-neutral-400 shrink-0 ml-2 transition-transform duration-200', isOpen && 'rotate-180 text-emerald-500')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xl p-1.5 space-y-0.5">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-neutral-400">No options available</div>
          ) : options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left',
                  isSelected
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {opt.icon}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">{opt.label}</p>
                    {opt.sublabel && <p className="text-[10px] text-neutral-400 truncate mt-0.5">{opt.sublabel}</p>}
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

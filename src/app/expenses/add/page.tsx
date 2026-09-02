'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiClient, Category, PaymentMethod } from '@/lib/api';
import { toMinorUnits, getCurrencyInfo } from '@/domain/currency';
import { currentDate, PAYMENT_METHOD_LABELS } from '@/domain/formatters';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { LoadingSpinner, PageHeader } from '@/components/ui/Primitives';
import { DatePicker } from '@/components/ui/DatePicker';
import { CustomSelect } from '@/components/ui/CustomSelect';

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'CASH', 'CARD', 'NET_BANKING', 'OTHER'];

export default function AddExpensePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState(currentDate());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) {
      apiClient.categories.getAll(user.id).then(cats => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
        setIsLoading(false);
      });
    }
  }, [user, authLoading, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!title.trim()) {
      errs.title = 'Expense title is required';
    }
    if (!categoryId) {
      errs.categoryId = 'Please choose a category';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setIsSaving(true);
    try {
      await apiClient.expenses.create(user.id, {
        title: title.trim(),
        note: note.trim() || undefined,
        amount: toMinorUnits(parseFloat(amount), user.currency),
        currency: user.currency,
        categoryId,
        paymentMethod,
        date,
        isRecurring: false,
      });
      showToast('Expense recorded!', 'success');
      router.push('/expenses');
    } catch {
      showToast('Failed to save expense', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAmountChange = (val: string) => {
    if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
      setAmount(val);
      if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size={32} /></div>;
  }
  if (!user) return null;

  const currInfo = getCurrencyInfo(user.currency);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header */}
      <PageHeader
        title="Add Expense"
        subtitle="Record a new transaction in your journal"
        backButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Amount — Hero Input */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-2 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Amount</span>
          <div className="flex items-center justify-center gap-1.5 w-full">
            <span className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400">{currInfo.symbol}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              className="w-48 text-4xl sm:text-5xl font-bold text-center bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-700 tabular-nums"
              autoFocus
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 font-medium mt-1">{errors.amount}</p>}
        </div>

        {/* Details Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <Input
            label="Title / Description"
            placeholder="e.g. Lunch with team, Groceries, Fuel"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            error={errors.title}
          />

          <Textarea
            label="Note (Optional)"
            placeholder="Add extra details or comments..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.slice(0, 8).map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: '' }));
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                    categoryId === cat.id
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 ring-2 ring-emerald-400/40 shadow-xs'
                      : 'border-neutral-200/70 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white/50 dark:bg-neutral-900/50'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 leading-tight truncate w-full">
                    {cat.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
            {categories.length > 8 && (
              <CustomSelect
                className="mt-2.5"
                value={categoryId}
                onChange={val => {
                  setCategoryId(val);
                  if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: '' }));
                }}
                options={categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
              />
            )}
            {errors.categoryId && <p className="text-xs text-red-500 font-semibold mt-1.5">{errors.categoryId}</p>}
          </div>

          {/* Date */}
          <DatePicker
            label="Date"
            value={date}
            onChange={setDate}
          />

          {/* Payment Method */}
          <CustomSelect
            label="Payment Method"
            value={paymentMethod}
            onChange={val => setPaymentMethod(val as PaymentMethod)}
            options={PAYMENT_METHODS.map(pm => ({ value: pm, label: PAYMENT_METHOD_LABELS[pm] }))}
          />
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isSaving} className="h-13 text-base shadow-md shadow-emerald-500/25">
          Save Expense
        </Button>
      </form>
    </div>
  );
}

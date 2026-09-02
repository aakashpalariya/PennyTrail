'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiClient, type Budget, type Category } from '@/lib/api';
import { formatAmount, toMinorUnits, getCurrencyInfo } from '@/domain/currency';
import { currentMonth } from '@/domain/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner, PageHeader, Badge, EmptyState } from '@/components/ui/Primitives';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Modal } from '@/components/ui/Modal';

interface BudgetWithSpend extends Budget {
  spent: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export default function BudgetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [budgets, setBudgets] = useState<BudgetWithSpend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [month] = useState(currentMonth());

  // Add budget form
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('global');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete budget modal
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithSpend | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const [rawBudgets, cats, expenses] = await Promise.all([
      apiClient.budgets.getForMonth(user.id, month),
      apiClient.categories.getAll(user.id),
      apiClient.expenses.getForMonth(user.id, month),
    ]);

    const catTotals = apiClient.expenses.getCategoryTotals(expenses);
    const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);

    const catMap = new Map(cats.map(c => [c.id, c]));
    const spendMap = new Map(catTotals.map(t => [t.categoryId, t.total]));

    const enriched: BudgetWithSpend[] = rawBudgets
      .filter(b => b.categoryId === 'global' || catMap.has(b.categoryId))
      .map(b => {
        const cat = b.categoryId === 'global' ? null : catMap.get(b.categoryId);
        return {
          ...b,
          spent: b.categoryId === 'global' ? monthTotal : (spendMap.get(b.categoryId) ?? 0),
          categoryName: b.categoryId === 'global' ? 'Overall Monthly' : (cat?.name ?? 'Other'),
          categoryIcon: b.categoryId === 'global' ? '💰' : (cat?.icon ?? '📦'),
          categoryColor: b.categoryId === 'global' ? '#10b981' : (cat?.color ?? '#6b7280'),
        };
      });

    // Sort: global first, then by amount desc
    enriched.sort((a, b) => (a.categoryId === 'global' ? -1 : b.categoryId === 'global' ? 1 : b.amount - a.amount));
    setBudgets(enriched);
    setCategories(cats);
    setIsLoading(false);
  }, [user, month]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) loadData();
  }, [user, authLoading, router, loadData]);

  const handleBudgetAmountChange = (val: string) => {
    const clean = val.replace(',', '.');
    // Allow empty string or numbers with up to 2 decimal places
    if (clean === '' || /^\d*(\.\d{0,2})?$/.test(clean)) {
      setBudgetAmount(clean);
      if (budgetError) setBudgetError('');
    }
  };

  const handleSaveBudget = async () => {
    const num = parseFloat(budgetAmount);
    if (!budgetAmount || isNaN(num) || num <= 0) {
      setBudgetError('Please enter a budget amount greater than 0');
      return;
    }
    setBudgetError('');
    setIsSaving(true);
    try {
      const amount = toMinorUnits(parseFloat(num.toFixed(2)), user?.currency ?? 'INR');
      await apiClient.budgets.upsert(user!.id, month, selectedCatId, amount, user?.currency ?? 'INR');
      showToast('Budget saved!', 'success');
      setBudgetAmount('');
      setShowAddForm(false);
      loadData();
    } catch {
      showToast('Failed to save budget', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteBudget = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.budgets.delete(deleteTarget.id);
      showToast('Budget removed', 'info');
      setDeleteTarget(null);
      loadData();
    } catch {
      showToast('Failed to delete budget', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size={32} /></div>;
  if (!user) return null;

  const currInfo = getCurrencyInfo(user.currency);
  const currency = user.currency;

  // Categories that don't have budgets yet
  const budgetedCatIds = new Set(budgets.map(b => b.categoryId));
  const unbudgetedCats = categories.filter(c => !budgetedCatIds.has(c.id));
  const categoryOptions = [
    { value: 'global', label: '💰 Overall Monthly Budget' },
    ...unbudgetedCats.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ].filter(o => !budgetedCatIds.has(o.value));

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header */}
      <PageHeader
        title="Budget"
        subtitle="Set and track monthly category and overall spending limits"
        actions={
          categoryOptions.length > 0 ? (
            <Button
              size="sm"
              onClick={() => {
                setShowAddForm(v => !v);
                setSelectedCatId(categoryOptions[0]?.value ?? 'global');
              }}
              leftIcon={<Plus size={15} strokeWidth={2.5} />}
            >
              Add Budget
            </Button>
          ) : null
        }
      />

      {/* Add budget form */}
      {showAddForm && categoryOptions.length > 0 && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs animate-fade-in">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Set Budget Limit</h2>

          <CustomSelect
            label="Category"
            options={categoryOptions}
            value={selectedCatId}
            onChange={(val) => setSelectedCatId(val)}
          />

          <div className="flex items-end gap-2.5">
            <Input
              label={`Amount (${currency})`}
              type="text"
              inputMode="decimal"
              placeholder="10000.00"
              value={budgetAmount}
              onChange={e => handleBudgetAmountChange(e.target.value)}
              error={budgetError}
              leftElement={<span className="text-sm font-bold">{currInfo.symbol}</span>}
              className="flex-1"
            />
            <Button onClick={handleSaveBudget} isLoading={isSaving} size="md" className="shrink-0 min-h-[44px]">
              Save
            </Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)} size="md" className="shrink-0 min-h-[44px]">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <EmptyState
          icon="💰"
          title="No budgets set"
          description="Set a monthly or category budget limit to track your spending limits."
          action={
            categoryOptions.length > 0 ? (
              <Button
                onClick={() => {
                  setShowAddForm(true);
                  setSelectedCatId(categoryOptions[0]?.value ?? 'global');
                }}
                leftIcon={<Plus size={15} />}
              >
                Set First Budget
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {budgets.map(budget => {
            const pct = Math.min(100, (budget.spent / budget.amount) * 100);
            const isOver = pct >= 100;
            const isWarning = pct >= 80;
            const remaining = Math.max(0, budget.amount - budget.spent);

            return (
              <div key={budget.id} className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-xs shrink-0"
                      style={{ backgroundColor: (budget.categoryColor ?? '#10b981') + '22' }}
                    >
                      {budget.categoryIcon}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{budget.categoryName}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                        {formatAmount(budget.spent, currency)} / {formatAmount(budget.amount, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isOver ? 'red' : isWarning ? 'amber' : 'emerald'} size="sm">
                      {Math.round(pct)}%
                    </Badge>
                    <Button
                      variant="danger-ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(budget)}
                      title="Remove Budget"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-xs text-neutral-400 mt-2 font-medium">
                  {isOver ? (
                    <span className="text-red-500 font-bold">Over by {formatAmount(budget.spent - budget.amount, currency)}</span>
                  ) : (
                    <>{formatAmount(remaining, currency)} remaining</>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Budget Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Budget?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Are you sure you want to remove the budget limit for <strong className="text-neutral-900 dark:text-neutral-100">&quot;{deleteTarget?.categoryName}&quot;</strong>?
          </p>
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="danger"
              fullWidth
              isLoading={isDeleting}
              onClick={confirmDeleteBudget}
            >
              Remove Budget
            </Button>
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

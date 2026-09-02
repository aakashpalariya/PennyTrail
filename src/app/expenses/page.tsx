'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, Trash2, Edit2, Plus, LayoutList, Table as TableIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiClient, Category, Expense } from '@/lib/api';
import { formatAmount } from '@/domain/currency';
import { groupExpensesByDate, formatDate, PAYMENT_METHOD_LABELS } from '@/domain/formatters';
import { EmptyState, LoadingSpinner, Badge, PageHeader } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableContainer, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';

const PAYMENT_METHOD_VARIANTS: Record<string, 'emerald' | 'amber' | 'blue' | 'purple' | 'neutral'> = {
  UPI: 'emerald',
  CASH: 'amber',
  CARD: 'blue',
  NET_BANKING: 'purple',
  OTHER: 'neutral',
};

export default function ExpensesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Deletion confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [exps, cats] = await Promise.all([
      apiClient.expenses.getAll(user.id),
      apiClient.categories.getAll(user.id),
    ]);
    setExpenses(exps);
    setCategories(cats);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) loadData();
  }, [user, authLoading, router, loadData]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const expToDelete = deleteTarget;
      await apiClient.expenses.softDelete(expToDelete.id);
      setExpenses(prev => prev.filter(e => e.id !== expToDelete.id));
      setDeleteTarget(null);
      showToast(`Deleted "${expToDelete.title}"`, 'success', {
        label: 'Undo',
        onClick: async () => {
          await apiClient.expenses.restore(expToDelete.id);
          loadData();
        },
      });
    } catch {
      showToast('Failed to delete expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter + search
  const filtered = expenses.filter(e => {
    const matchSearch = !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.note ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'all' || e.categoryId === filterCategory;
    return matchSearch && matchCat;
  });

  const catMap = new Map(categories.map(c => [c.id, c]));
  const grouped = groupExpensesByDate(filtered);
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size={32} /></div>;
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header */}
      <PageHeader
        title="Expenses"
        subtitle={`${filtered.length} transaction${filtered.length === 1 ? '' : 's'} · ${formatAmount(totalAmount, user.currency)}`}
        actions={
          <Link href="/expenses/add">
            <Button size="sm" leftIcon={<Plus size={15} strokeWidth={2.5} />}>
              Add Expense
            </Button>
          </Link>
        }
      />

      {/* Search + Filter Action Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search expenses by title or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Button
          variant={showFilters || filterCategory !== 'all' ? 'secondary' : 'outline'}
          size="md"
          onClick={() => setShowFilters(v => !v)}
          leftIcon={<Filter size={15} />}
        >
          <span>Filter</span>
          {filterCategory !== 'all' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="glass-card rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs animate-fade-in">
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-2.5 uppercase tracking-wider">
            Filter by Category
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              All Categories ({expenses.length})
            </button>
            {categories.map(c => {
              const count = expenses.filter(e => e.categoryId === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    filterCategory === c.id
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                  <span className="opacity-70 text-[11px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expenses Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="💸"
          title="No expenses found"
          description={searchQuery || filterCategory !== 'all' ? 'Try adjusting your search query or category filter' : 'Record your first expense to begin tracking your spending journal.'}
          action={
            !searchQuery && filterCategory === 'all' ? (
              <Link href="/expenses/add">
                <Button leftIcon={<Plus size={16} />}>Add Expense</Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}>
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* DESKTOP VIEW: Structured, Consistent Data Table (Hidden on Mobile) */}
          <div className="hidden md:block">
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Title & Details</TableHead>
                    <TableHead className="w-44">Category</TableHead>
                    <TableHead className="w-36">Payment Method</TableHead>
                    <TableHead align="right" className="w-36">Amount</TableHead>
                    <TableHead align="right" className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(expense => {
                    const cat = catMap.get(expense.categoryId);
                    const methodVariant = PAYMENT_METHOD_VARIANTS[expense.paymentMethod] ?? 'neutral';
                    return (
                      <TableRow
                        key={expense.id}
                        clickable
                        onClick={() => router.push(`/expenses/${expense.id}/edit`)}
                      >
                        <TableCell className="text-xs text-neutral-500 dark:text-neutral-400 font-medium whitespace-nowrap">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {expense.title}
                          </p>
                          {expense.note && (
                            <p className="text-xs text-neutral-400 truncate mt-0.5 max-w-md">
                              {expense.note}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
                            style={{ backgroundColor: (cat?.color ?? '#6b7280') + '1a', color: cat?.color ?? '#6b7280' }}
                          >
                            <span>{cat?.icon ?? '📦'}</span>
                            <span className="truncate">{cat?.name ?? 'Other'}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={methodVariant} size="sm">
                            {PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell align="right" className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                          {formatAmount(expense.amount, user.currency)}
                        </TableCell>
                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Edit"
                              onClick={() => router.push(`/expenses/${expense.id}/edit`)}
                            >
                              <Edit2 size={14} className="text-neutral-500 hover:text-emerald-600" />
                            </Button>
                            <Button
                              variant="danger-ghost"
                              size="icon-sm"
                              title="Delete"
                              onClick={() => setDeleteTarget(expense)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* MOBILE VIEW: Grouped Responsive Cards (Exact same hierarchy, typography & actions) */}
          <div className="flex flex-col gap-4 md:hidden">
            {grouped.map(({ label, date, items }) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">
                    {formatAmount(items.reduce((s, e) => s + e.amount, 0), user.currency)}
                  </span>
                </div>
                <div className="glass-card rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                  {items.map(expense => {
                    const cat = catMap.get(expense.categoryId);
                    const methodVariant = PAYMENT_METHOD_VARIANTS[expense.paymentMethod] ?? 'neutral';
                    return (
                      <div
                        key={expense.id}
                        onClick={() => router.push(`/expenses/${expense.id}/edit`)}
                        className="flex items-center gap-3 px-3.5 py-3 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer active:scale-[0.99]"
                      >
                        {/* Category icon */}
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                          style={{ backgroundColor: (cat?.color ?? '#6b7280') + '22' }}
                        >
                          {cat?.icon ?? '📦'}
                        </span>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {expense.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[110px]">
                              {cat?.name ?? 'Other'}
                            </span>
                            <span className="text-neutral-300 dark:text-neutral-600">·</span>
                            <Badge variant={methodVariant} size="sm">
                              {PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod}
                            </Badge>
                          </div>
                        </div>

                        {/* Amount + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {formatAmount(expense.amount, user.currency)}
                          </span>
                          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Edit"
                              onClick={() => router.push(`/expenses/${expense.id}/edit`)}
                            >
                              <Edit2 size={14} className="text-neutral-500 hover:text-emerald-600" />
                            </Button>
                            <Button
                              variant="danger-ghost"
                              size="icon-sm"
                              title="Delete"
                              onClick={() => setDeleteTarget(expense)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Expense?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete <strong className="text-neutral-900 dark:text-neutral-100">&quot;{deleteTarget?.title}&quot;</strong> ({deleteTarget ? formatAmount(deleteTarget.amount, user.currency) : ''})?
          </p>
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="danger"
              fullWidth
              isLoading={isDeleting}
              onClick={confirmDelete}
            >
              Delete Expense
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


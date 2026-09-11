'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  PieChart as PieChartIcon,
  Flame,
  Activity,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient, type Category, type Expense } from '@/lib/api';
import { formatAmount, formatAmountCompact } from '@/domain/currency';
import { formatDate, currentMonth, currentDate } from '@/domain/formatters';
import { LoadingSpinner, PageHeader, StatCard } from '@/components/ui/Primitives';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, CartesianGrid,
} from 'recharts';

interface DashboardData {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthCount: number;
  monthBudget: number | null;
  avgDaily: number;
  dailyData: { date: string; label: string; total: number }[];
  recentExpenses: Expense[];
  categoryData: { name: string; value: number; color: string; icon: string; percentage: number }[];
  topCategory: { name: string; value: number; icon: string; percentage: number } | null;
  categories: Category[];
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);

  const isDark = resolvedTheme === 'dark';

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const month = currentMonth();
      const today = currentDate();

      // Parallel fetch using API client
      const [allExpenses, allCategories, budgets] = await Promise.all([
        apiClient.expenses.getForMonth(user.id, month),
        apiClient.categories.getAll(user.id),
        apiClient.budgets.getForMonth(user.id, month),
      ]);

      const catMap = new Map(allCategories.map(c => [c.id, c]));

      // Today's total and count
      const todayExpenses = allExpenses.filter(e => e.date === today);
      const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
      const todayCount = todayExpenses.length;

      // Month total and count
      const monthTotal = allExpenses.reduce((s, e) => s + e.amount, 0);
      const monthCount = allExpenses.length;

      // Month budget (global or sum)
      const globalBudget = budgets.find(b => b.categoryId === 'global');
      const monthBudget = globalBudget
        ? globalBudget.amount
        : budgets.length > 0
        ? budgets.reduce((s, b) => s + b.amount, 0)
        : null;

      // Average daily spend across active days
      const uniqueDays = new Set(allExpenses.map(e => e.date)).size;
      const avgDaily = uniqueDays > 0 ? Math.round(monthTotal / uniqueDays) : 0;

      // Last 7 days daily data
      const dailyData = apiClient.expenses.getDailyTotals(allExpenses, 7);

      // Recent 5 expenses
      const recentExpenses = [...allExpenses]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Category breakdown (consolidate any missing/deleted into 'Other')
      const catTotalsList = apiClient.expenses.getCategoryTotals(allExpenses);
      const otherCat = allCategories.find(c => c.id === 'cat-other' || c.name === 'Other') ?? {
        id: 'cat-other',
        name: 'Other',
        icon: '📦',
        color: '#6b7280',
      };

      const aggregatedMap = new Map<string, { name: string; value: number; color: string; icon: string }>();
      for (const t of catTotalsList) {
        const cat = catMap.get(t.categoryId) ?? otherCat;
        const existing = aggregatedMap.get(cat.name);
        if (existing) {
          existing.value += t.total;
        } else {
          aggregatedMap.set(cat.name, {
            name: cat.name,
            value: t.total,
            color: cat.color,
            icon: cat.icon,
          });
        }
      }

      const categoryData = Array.from(aggregatedMap.values())
        .map(item => ({
          ...item,
          percentage: monthTotal > 0 ? Math.round((item.value / monthTotal) * 100) : 0,
        }))
        .sort((a, b) => b.value - a.value);

      const topCategory = categoryData[0] ?? null;

      setData({
        todayTotal,
        todayCount,
        monthTotal,
        monthCount,
        monthBudget,
        avgDaily,
        dailyData,
        recentExpenses,
        categoryData,
        topCategory,
        categories: allCategories,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) loadData();
  }, [user, authLoading, router, loadData]);

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size={32} /></div>;
  }

  if (!user || !data) return null;

  const currency = user.currency;
  const budgetPercent = data.monthBudget ? Math.min(100, (data.monthTotal / data.monthBudget) * 100) : null;
  const maxDaily = Math.max(...data.dailyData.map(d => d.total), 1);

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`${user.name} · Financial Overview`}
      />

      {/* Colorful Stat Cards Grid (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today's Spend */}
        <StatCard
          label="Today"
          value={formatAmount(data.todayTotal, currency)}
          sub={data.todayCount > 0 ? `${data.todayCount} expense${data.todayCount === 1 ? '' : 's'} today` : 'No expenses today'}
          color="emerald"
          icon={Calendar}
        />

        {/* Card 2: This Month */}
        <StatCard
          label="This Month"
          value={formatAmount(data.monthTotal, currency)}
          sub={budgetPercent !== null ? `${Math.round(budgetPercent)}% of budget` : `${data.monthCount} transactions`}
          trend={budgetPercent !== null && budgetPercent > 85 ? 'up' : undefined}
          color="blue"
          icon={CreditCard}
        />

        {/* Card 3: Daily Average */}
        <StatCard
          label="Daily Average"
          value={formatAmount(data.avgDaily, currency)}
          sub="across active days"
          color="amber"
          icon={Flame}
        />

        {/* Card 4: Top Category */}
        <StatCard
          label="Top Category"
          value={data.topCategory ? data.topCategory.name : 'None'}
          sub={data.topCategory ? `${formatAmount(data.topCategory.value, currency)} (${data.topCategory.percentage}%)` : 'No expenses recorded'}
          color="purple"
          icon={PieChartIcon}
        />
      </div>

      {/* Budget progress */}
      {data.monthBudget && budgetPercent !== null && (
        <div className="glass-card rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Monthly Budget</span>
            <span className={`text-xs font-bold ${budgetPercent > 90 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatAmount(data.monthTotal, currency)} / {formatAmount(data.monthBudget, currency)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-1.5 font-medium">
            {formatAmount(Math.max(0, (data.monthBudget ?? 0) - data.monthTotal), currency)} remaining
          </p>
        </div>
      )}

      {/* 7-Day Bar Chart */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">Last 7 Days Spending</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Daily expense trend</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {formatAmount(data.dailyData.reduce((s, d) => s + d.total, 0), currency)}
          </span>
        </div>

        {data.dailyData.every(d => d.total === 0) ? (
          <div className="flex flex-col items-center justify-center h-44 text-neutral-400 text-xs">
            <p className="font-semibold">No expenses in the last 7 days</p>
            <p className="mt-1 text-neutral-400">Add an expense to see your daily chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyData} maxBarSize={32} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} vertical={false} fill="none" />
              <XAxis
                dataKey="label"
                interval={0}
                tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatAmountCompact(v as number, currency)}
                width={55}
                tickMargin={6}
                tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-2xl p-2.5 px-3.5 shadow-xl border bg-white/95 dark:bg-neutral-900/95 border-neutral-200/90 dark:border-neutral-800 backdrop-blur-md">
                      <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500">{label}</p>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatAmount(payload[0].value as number, currency)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {data.dailyData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.total === maxDaily && entry.total > 0 ? '#10b981' : isDark ? '#334155' : '#cbd5e1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Breakdown Donut + List */}
      {data.categoryData.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">Category Breakdown</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Where your money went this month</p>
            </div>
            <Link
              href="/analytics"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Details <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Donut Chart with Unobstructed Center Information */}
            <div className="relative shrink-0 w-48 h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    cornerRadius={5}
                    stroke={isDark ? '#111a14' : '#ffffff'}
                    strokeWidth={2.5}
                    onMouseEnter={(_, index) => setHoveredCategoryIndex(index)}
                    onMouseLeave={() => setHoveredCategoryIndex(null)}
                  >
                    {data.categoryData.map((entry, index) => {
                      const isHovered = hoveredCategoryIndex === index;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          style={{
                            filter: isHovered ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' : 'none',
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center center',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Badge inside the Donut Hole (100% Readable, No Floating Tooltip Overlap) */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-2 select-none">
                {hoveredCategoryIndex !== null && data.categoryData[hoveredCategoryIndex] ? (
                  <div className="flex flex-col items-center animate-fade-in">
                    <span className="text-xl mb-0.5 leading-none">
                      {data.categoryData[hoveredCategoryIndex].icon}
                    </span>
                    <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 leading-tight">
                      {formatAmount(data.categoryData[hoveredCategoryIndex].value, currency)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                      {data.categoryData[hoveredCategoryIndex].percentage}%
                    </span>
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[95px] leading-tight">
                      {data.categoryData[hoveredCategoryIndex].name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-fade-in">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Total
                    </span>
                    <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {formatAmount(data.monthTotal, currency)}
                    </span>
                    <span className="text-[10px] font-medium text-neutral-400 mt-0.5">
                      {data.categoryData.length} categories
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category List with Synchronized Hover */}
            <div className="flex flex-col gap-1.5 flex-1 w-full min-w-0">
              {data.categoryData.slice(0, 5).map((cat, idx) => {
                const isHovered = hoveredCategoryIndex === idx;
                return (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setHoveredCategoryIndex(idx)}
                    onMouseLeave={() => setHoveredCategoryIndex(null)}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer',
                      isHovered
                        ? 'bg-neutral-100/90 dark:bg-neutral-800/70 ring-1 ring-emerald-500/40 shadow-xs'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex-1 truncate">
                      {cat.name}
                    </span>
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                      {formatAmount(cat.value, currency)}
                    </span>
                    <span className="text-xs font-medium text-neutral-400 w-9 text-right shrink-0">
                      {cat.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Expenses List */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">Recent Expenses</h2>
          <Link
            href="/expenses"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            See All <ArrowRight size={12} />
          </Link>
        </div>

        {data.recentExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <p className="text-xs font-medium">No expenses yet</p>
            <Link
              href="/expenses/add"
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-xs"
            >
              <Plus size={14} /> Add First Expense
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {data.recentExpenses.map(expense => {
              const cat = data.categories.find(c => c.id === expense.categoryId);
              return (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}/edit`}
                  className="flex items-center gap-3 py-3 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                    style={{ backgroundColor: (cat?.color ?? '#6b7280') + '22' }}
                  >
                    {cat?.icon ?? '📦'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{expense.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{formatDate(expense.date)} · {cat?.name ?? 'Other'}</p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                    {formatAmount(expense.amount, currency)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Flame,
  PieChart as PieChartIcon,
  Activity,
  CalendarDays,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient, type Category, type Expense } from '@/lib/api';
import { formatAmount, formatAmountCompact } from '@/domain/currency';
import { formatDate, formatMonth } from '@/domain/formatters';
import { LoadingSpinner, PageHeader, StatCard, EmptyState } from '@/components/ui/Primitives';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, CartesianGrid,
} from 'recharts';

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [monthTotal, setMonthTotal] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [avgDaily, setAvgDaily] = useState(0);
  const [activeDaysCount, setActiveDaysCount] = useState(0);
  const [highestExpense, setHighestExpense] = useState<Expense | null>(null);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string; icon: string }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; label: string; total: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; label: string; dayName?: string; fullDate?: string; total: number }[]>([]);
  const [weekdayData, setWeekdayData] = useState<{ day: string; total: number; count: number }[]>([]);
  const [prevMonthTotal, setPrevMonthTotal] = useState(0);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);

  const isDark = resolvedTheme === 'dark';

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const [cats, expenses, trend] = await Promise.all([
      apiClient.categories.getAll(user.id),
      apiClient.expenses.getForMonth(user.id, selectedMonth),
      apiClient.expenses.getMonthlyTotals(user.id, 6),
    ]);

    setCategories(cats);
    const catMap = new Map(cats.map(c => [c.id, c]));

    // Month total & transactions
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    setMonthTotal(total);
    setTotalTransactions(expenses.length);

    // Highest expense this month
    const sortedByAmt = [...expenses].sort((a, b) => b.amount - a.amount);
    setHighestExpense(sortedByAmt[0] ?? null);

    // Avg daily (unique dates)
    const uniqueDates = new Set(expenses.map(e => e.date));
    setActiveDaysCount(uniqueDates.size);
    setAvgDaily(uniqueDates.size > 0 ? Math.round(total / uniqueDates.size) : 0);

    // Category data (consolidate any missing/deleted into 'Other')
    const catTotalsList = apiClient.expenses.getCategoryTotals(expenses);
    const otherCat = cats.find(c => c.id === 'cat-other' || c.name === 'Other') ?? {
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

    const catArr = Array.from(aggregatedMap.values()).sort((a, b) => b.value - a.value);
    setCategoryData(catArr);

    // Monthly trend
    const trendData = trend.map(t => ({ ...t, label: format(parseISO(`${t.month}-01`), 'MMM') }));
    setMonthlyTrend(trendData);

    // Prev month
    const prevMonth = format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM');
    const prevMonthExpenses = await apiClient.expenses.getForMonth(user.id, prevMonth);
    const prevTotal = prevMonthExpenses.reduce((s, e) => s + e.amount, 0);
    setPrevMonthTotal(prevTotal);

    // Daily data for selected month
    const dailyMap = new Map<string, number>();
    for (const e of expenses) dailyMap.set(e.date, (dailyMap.get(e.date) ?? 0) + e.amount);
    const dailyArr = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date,
        label: format(parseISO(date), 'd MMM'),
        dayName: format(parseISO(date), 'EEE'),
        fullDate: format(parseISO(date), 'EEEE, d MMMM yyyy'),
        total,
      }));
    setDailyData(dailyArr);

    // Weekday data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const wdMap = new Map<number, { total: number; count: number }>();
    for (let i = 0; i < 7; i++) wdMap.set(i, { total: 0, count: 0 });
    for (const e of expenses) {
      const wd = parseISO(e.date).getDay();
      const cur = wdMap.get(wd)!;
      wdMap.set(wd, { total: cur.total + e.amount, count: cur.count + 1 });
    }
    const wdArr = Array.from(wdMap.entries()).map(([wd, d]) => ({ day: days[wd], total: d.total, count: d.count }));
    setWeekdayData(wdArr);

    setIsLoading(false);
  }, [user, selectedMonth]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) loadData();
  }, [user, authLoading, router, loadData]);

  const prevM = () => setSelectedMonth(m => format(subMonths(parseISO(`${m}-01`), 1), 'yyyy-MM'));
  const nextM = () => {
    const next = addMonths(parseISO(`${selectedMonth}-01`), 1);
    if (next <= new Date()) setSelectedMonth(format(next, 'yyyy-MM'));
  };

  if (authLoading || isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size={32} /></div>;
  if (!user) return null;

  const currency = user.currency;
  const totalDiff = monthTotal - prevMonthTotal;
  const topCategory = categoryData[0] ?? null;
  const topCategoryShare = monthTotal > 0 && topCategory ? Math.round((topCategory.value / monthTotal) * 100) : 0;
  const gridStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const axisColor = isDark ? '#9ca3af' : '#64748b';

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-16 sm:pb-8">
      {/* Unified Page Header with Month Selector */}
      <PageHeader
        title="Analytics"
        subtitle="Trends & spending pattern analysis"
        actions={
          <div className="flex items-center gap-2 glass-card rounded-2xl px-3 py-1.5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <button
              type="button"
              onClick={prevM}
              className="p-1 text-neutral-500 hover:text-emerald-500 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 min-w-[95px] text-center">
              {formatMonth(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={nextM}
              className="p-1 text-neutral-500 hover:text-emerald-500 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      {/* Colorful Summary Stat Cards (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Spent */}
        <StatCard
          label="Total Spent"
          value={formatAmount(monthTotal, currency)}
          sub={`${totalDiff > 0 ? '+' : totalDiff < 0 ? '-' : ''}${formatAmount(Math.abs(totalDiff), currency)} vs last month`}
          trend={totalDiff > 0 ? 'up' : totalDiff < 0 ? 'down' : undefined}
          color="rose"
          icon={CreditCard}
        />

        {/* Card 2: Daily Average */}
        <StatCard
          label="Daily Average"
          value={formatAmount(avgDaily, currency)}
          sub={`across ${activeDaysCount} active day${activeDaysCount === 1 ? '' : 's'}`}
          color="blue"
          icon={Activity}
        />

        {/* Card 3: Largest Expense */}
        <StatCard
          label="Largest Expense"
          value={highestExpense ? formatAmount(highestExpense.amount, currency) : formatAmount(0, currency)}
          sub={highestExpense ? `"${highestExpense.title}"` : 'No expenses'}
          color="amber"
          icon={Flame}
        />

        {/* Card 4: Top Category */}
        <StatCard
          label="Top Category"
          value={topCategory ? topCategory.name : 'None'}
          sub={topCategory ? `${formatAmount(topCategory.value, currency)} (${topCategoryShare}%)` : 'No expenses logged'}
          color="purple"
          icon={PieChartIcon}
        />
      </div>

      {/* 6-month trend */}
      {monthlyTrend.length > 1 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4">6-Month Spending Trend</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={isDark ? 0.35 : 0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} fill="none" />
              <XAxis dataKey="label" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: axisColor, fontWeight: 500 }} />
              <YAxis
                tickFormatter={(v) => formatAmountCompact(v as number, currency)}
                width={55}
                tickMargin={6}
                tick={{ fontSize: 10, fill: axisColor, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.4)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
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
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#trendGradient)"
                dot={{ fill: isDark ? '#111a14' : '#ffffff', stroke: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily spend for month */}
      {dailyData.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Daily Breakdown</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Spending by date in {formatMonth(selectedMonth)}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {dailyData.length} active day{dailyData.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className={dailyData.length > 8 ? "overflow-x-auto pb-1 -mx-2 px-2 scrollbar-thin" : "w-full"}>
            <div style={dailyData.length > 8 ? { minWidth: dailyData.length * 48 } : { width: '100%' }}>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dailyData} maxBarSize={34} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} fill="none" />
                  <XAxis dataKey="label" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: axisColor, fontWeight: 500 }} />
                  <YAxis
                    tickFormatter={(v) => formatAmountCompact(v as number, currency)}
                    width={55}
                    tickMargin={6}
                    tick={{ fontSize: 10, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-2xl p-2.5 px-3.5 shadow-xl border bg-white/95 dark:bg-neutral-900/95 border-neutral-200/90 dark:border-neutral-800 backdrop-blur-md">
                          <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500">{item.fullDate || item.label}</p>
                          <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {formatAmount(payload[0].value as number, currency)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="total" fill={isDark ? '#34d399' : '#10b981'} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4">Category Breakdown</h2>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Donut Chart with Unobstructed Center Information */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
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
                    {categoryData.map((entry, i) => {
                      const isHovered = hoveredCategoryIndex === i;
                      return (
                        <Cell
                          key={i}
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
                {hoveredCategoryIndex !== null && categoryData[hoveredCategoryIndex] ? (
                  <div className="flex flex-col items-center animate-fade-in">
                    <span className="text-xl mb-0.5 leading-none">
                      {categoryData[hoveredCategoryIndex].icon}
                    </span>
                    <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 leading-tight">
                      {formatAmount(categoryData[hoveredCategoryIndex].value, currency)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                      {monthTotal > 0 ? Math.round((categoryData[hoveredCategoryIndex].value / monthTotal) * 100) : 0}%
                    </span>
                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[95px] leading-tight">
                      {categoryData[hoveredCategoryIndex].name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-fade-in">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Total
                    </span>
                    <span className="text-xs font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {formatAmount(monthTotal, currency)}
                    </span>
                    <span className="text-[10px] font-medium text-neutral-400 mt-0.5">
                      {categoryData.length} categories
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category List with Synchronized Hover */}
            <div className="flex flex-col gap-1.5 max-w-sm w-full">
              {categoryData.map((cat, i) => {
                const pct = monthTotal > 0 ? Math.round((cat.value / monthTotal) * 100) : 0;
                const isHovered = hoveredCategoryIndex === i;
                return (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setHoveredCategoryIndex(i)}
                    onMouseLeave={() => setHoveredCategoryIndex(null)}
                    className={cn(
                      'flex items-center justify-between gap-3 p-2 px-2.5 rounded-xl transition-all cursor-pointer',
                      isHovered
                        ? 'bg-neutral-100/90 dark:bg-neutral-800/70 ring-1 ring-emerald-500/40 shadow-xs'
                        : 'hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: cat.color }} />
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{formatAmount(cat.value, currency)}</span>
                      <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Day of week heatmap */}
      {weekdayData.some(d => d.total > 0) && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4">Spending by Weekday</h2>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weekdayData} barSize={24} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} fill="none" />
              <XAxis dataKey="day" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: axisColor, fontWeight: 500 }} />
              <YAxis
                tickFormatter={(v) => formatAmountCompact(v as number, currency)}
                width={55}
                tickMargin={6}
                tick={{ fontSize: 10, fill: axisColor }}
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
              <Bar dataKey="total" fill={isDark ? '#34d399' : '#10b981'} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {categoryData.length === 0 && (
        <EmptyState
          icon="📊"
          title={`No data for ${formatMonth(selectedMonth)}`}
          description="No expenses have been recorded for this month yet. Switch months or add an expense to see analytics."
        />
      )}
    </div>
  );
}


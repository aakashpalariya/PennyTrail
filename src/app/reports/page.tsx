'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Image as ImageIcon,
  Copy,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  TrendingUp,
  CreditCard,
  Receipt,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { apiClient, Expense, Category } from '@/lib/api';
import { formatAmount, toMajorUnits } from '@/domain/currency';
import { formatDate, PAYMENT_METHOD_LABELS } from '@/domain/formatters';
import { DatePicker } from '@/components/ui/DatePicker';
import { LoadingSpinner, PageHeader, Badge } from '@/components/ui/Primitives';
import { TableContainer, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from '@/components/ui/Table';
import {
  PennyTrailReportData,
  buildReportData,
  downloadPennyTrailPdf,
  downloadPennyTrailPhoto,
  downloadPennyTrailExcel,
  formatShareTextSummary,
} from '@/domain/export/reports-generator';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

type RangePreset = 'this_month' | 'last_3_months' | 'custom';
type ViewTab = 'pdf' | 'excel';
type ExcelSheet = 'transactions' | 'categories' | 'overview';

export default function ReportsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [preset, setPreset] = useState<RangePreset>('this_month');
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(today);

  const [activeTab, setActiveTab] = useState<ViewTab>('pdf');
  const [activeExcelSheet, setActiveExcelSheet] = useState<ExcelSheet>('transactions');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const reportCardRef = useRef<HTMLDivElement | null>(null);

  // Compute active date range
  const { start, end, rangeLabel } = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case 'this_month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
          rangeLabel: format(now, 'MMMM yyyy'),
        };
      case 'last_3_months': {
        const s = subMonths(now, 3);
        return {
          start: format(startOfMonth(s), 'yyyy-MM-dd'),
          end: today,
          rangeLabel: 'Last 3 Months',
        };
      }
      case 'custom':
        return {
          start: customStart,
          end: customEnd,
          rangeLabel: 'Custom Range',
        };
    }
  }, [preset, customStart, customEnd, today]);

  // Load data for date range
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;
    setIsLoading(true);

    Promise.all([
      apiClient.expenses.getForRange(user.id, start, end),
      apiClient.categories.getAll(user.id),
    ])
      .then(([exps, cats]) => {
        if (!isCancelled) {
          setExpenses(exps);
          setCategories(cats);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          showToast('Failed to load report data', 'error');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user, start, end, showToast]);

  // Build report dataset
  const reportData: PennyTrailReportData | null = useMemo(() => {
    if (!user) return null;
    return buildReportData(user, expenses, categories, start, end, rangeLabel);
  }, [user, expenses, categories, start, end, rangeLabel]);

  if (!user) return null;

  const fileNameBase = `PennyTrail_Report_${start}_to_${end}`;

  // Download Handlers
  const handleDownloadPdf = async () => {
    if (!reportData) return;
    setIsGeneratingPdf(true);
    try {
      await downloadPennyTrailPdf(reportData, `${fileNameBase}.pdf`);
      showToast('PDF report downloaded successfully!', 'success');
    } catch {
      showToast('Failed to generate PDF', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPhoto = async () => {
    if (!reportCardRef.current) return;
    setIsGeneratingPhoto(true);
    try {
      await downloadPennyTrailPhoto(reportCardRef.current, `${fileNameBase}.png`);
      showToast('Report image (PNG) downloaded successfully!', 'success');
    } catch {
      showToast('Failed to capture report photo', 'error');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!reportData) return;
    setIsGeneratingExcel(true);
    try {
      await downloadPennyTrailExcel(reportData, `${fileNameBase}.xlsx`);
      showToast('Excel workbook (.xlsx) downloaded successfully!', 'success');
    } catch {
      showToast('Failed to generate Excel', 'error');
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleCopySummary = async () => {
    if (!reportData) return;
    try {
      const summaryText = formatShareTextSummary(reportData);
      await navigator.clipboard.writeText(summaryText);
      setIsCopied(true);
      showToast('Report summary copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const PRESETS: { value: RangePreset; label: string }[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto py-2 pb-20 sm:pb-12 animate-fade-in">
      {/* Unified Page Header */}
      <PageHeader
        title="Financial Reports"
        subtitle="Review, preview, and export high-resolution PDF or Excel workbooks"
      />

      {/* Date Range Selector */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Select Report Range
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            {PRESETS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPreset(p.value)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0',
                  preset === p.value
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Desktop Inline Custom Date Range */}
          {preset === 'custom' && (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800 animate-fade-in">
              <div className="w-36">
                <DatePicker value={customStart} onChange={setCustomStart} />
              </div>
              <span className="text-xs font-bold text-neutral-400">to</span>
              <div className="w-36">
                <DatePicker value={customEnd} onChange={setCustomEnd} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Side-by-Side Custom Date Range */}
        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-2.5 lg:hidden pt-1 animate-fade-in">
            <div>
              <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">From</span>
              <DatePicker value={customStart} onChange={setCustomStart} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">To</span>
              <DatePicker value={customEnd} onChange={setCustomEnd} />
            </div>
          </div>
        )}
      </div>

      {/* Download & Share Options */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            Download Options
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Export report as a high-res Photo (PNG), PDF document, Excel spreadsheet, or copy summary.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Photo (PNG) */}
          <button
            type="button"
            onClick={handleDownloadPhoto}
            disabled={isGeneratingPhoto || expenses.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs bg-white dark:bg-neutral-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 disabled:opacity-50"
          >
            {isGeneratingPhoto ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            )}
            <span>{isGeneratingPhoto ? 'Capturing...' : 'Photo (PNG)'}</span>
          </button>

          {/* PDF (.pdf) */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || expenses.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs bg-white dark:bg-neutral-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{isGeneratingPdf ? 'Building PDF...' : 'PDF (.pdf)'}</span>
          </button>

          {/* Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isGeneratingExcel || expenses.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50"
          >
            {isGeneratingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{isGeneratingExcel ? 'Building...' : 'Excel (.xlsx)'}</span>
          </button>

          {/* Copy Summary */}
          <button
            type="button"
            onClick={handleCopySummary}
            disabled={expenses.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Preview Header & View Mode Switcher (After Download Options) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
            Report Preview
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Switch between printable PDF document layout and Excel workbook spreadsheet view.
          </p>
        </div>

        {/* View Mode Tabs (PDF View / Excel View) */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'pdf'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            )}
          >
            <FileText size={15} /> PDF View
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'excel'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            )}
          >
            <FileSpreadsheet size={15} /> Excel View
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size={36} />
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-neutral-200/80 dark:border-neutral-800">
          <Receipt size={40} className="mx-auto text-neutral-400 mb-3 opacity-50" />
          <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-200">No expenses recorded in this period</h2>
          <p className="text-xs text-neutral-400 mt-1">Try selecting another date range or add new expenses.</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PDF VIEW (Document Preview) */}
          {activeTab === 'pdf' && reportData && (
            <div
              ref={reportCardRef}
              className="bg-white text-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xl max-w-4xl mx-auto space-y-6 animate-fade-in"
            >
              {/* Document Banner */}
              <div className="report-header-row flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-200 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="report-header-avatar w-12 h-12 aspect-square rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-base font-black tracking-wider shadow-md shadow-emerald-500/25 shrink-0 select-none">
                    {reportData.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                        {reportData.userName}
                      </h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                        Expense Report
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>Created with PennyTrail</span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-neutral-400">{reportData.userEmail}</span>
                    </p>
                  </div>
                </div>

                <div className="report-header-meta flex flex-col sm:items-end gap-0.5 shrink-0 text-xs text-neutral-600">
                  <p>
                    Period: <strong className="text-neutral-900 font-bold">{reportData.formattedPeriod}</strong>
                  </p>
                  <p className="text-[11px] text-neutral-400 font-medium sm:text-right">
                    Generated: {reportData.generatedAt}
                  </p>
                </div>
              </div>

              {/* Financial KPI Summary Cards */}
              <div className="report-kpi-grid grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Spent</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                    {formatAmount(reportData.totalSpent, reportData.currency)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Transactions</p>
                  <p className="text-lg sm:text-xl font-black text-blue-700 mt-1">
                    {reportData.totalTransactions}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Avg Daily</p>
                  <p className="text-lg sm:text-xl font-black text-amber-700 mt-1">
                    {formatAmount(reportData.avgDaily, reportData.currency)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80">
                  <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Top Category</p>
                  <p className="text-sm sm:text-base font-black text-purple-700 mt-1 truncate">
                    {reportData.topCategory}
                  </p>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChartIcon size={14} className="text-emerald-600" /> Category Breakdown
                </h3>
                <div className="rounded-2xl border border-neutral-200 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                      <tr>
                        <th className="py-2.5 px-3.5 whitespace-nowrap">Category</th>
                        <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Transactions</th>
                        <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Share</th>
                        <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {reportData.categorySummaries.map(c => (
                        <tr key={c.name} className="hover:bg-neutral-50/50">
                          <td className="py-2.5 px-3.5 font-semibold flex items-center gap-2 whitespace-nowrap">
                            <span>{c.icon}</span>
                            <span>{c.name}</span>
                          </td>
                          <td className="py-2.5 px-3.5 text-center text-neutral-600 whitespace-nowrap">{c.count}</td>
                          <td className="py-2.5 px-3.5 text-center font-bold text-neutral-700 whitespace-nowrap">{c.percentage}%</td>
                          <td className="py-2.5 px-3.5 text-right font-bold text-neutral-900 whitespace-nowrap">
                            {formatAmount(c.total, reportData.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Transactions Table */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt size={14} className="text-emerald-600" /> Detailed Transactions ({reportData.expenses.length})
                </h3>
                <div className="rounded-2xl border border-neutral-200 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-neutral-900 text-white font-bold">
                      <tr>
                        <th className="py-2.5 px-3.5">Date</th>
                        <th className="py-2.5 px-3.5">Title & Details</th>
                        <th className="py-2.5 px-3.5">Category</th>
                        <th className="py-2.5 px-3.5">Payment</th>
                        <th className="py-2.5 px-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {reportData.expenses.map(e => (
                        <tr key={e.id} className="hover:bg-neutral-50/50">
                          <td className="py-2.5 px-3.5 text-neutral-500 whitespace-nowrap">{formatDate(e.date)}</td>
                          <td className="py-2.5 px-3.5 font-bold text-neutral-900">
                            {e.title}
                            {e.note && <span className="block text-[11px] font-normal text-neutral-400">{e.note}</span>}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700 font-semibold text-[11px]">
                              {e.categoryIcon} {e.categoryName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-neutral-500 text-[11px] whitespace-nowrap">
                            {PAYMENT_METHOD_LABELS[e.paymentMethod] ?? e.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-neutral-900 whitespace-nowrap">
                            {formatAmount(e.amount, e.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-100 font-bold border-t border-neutral-200">
                      <tr>
                        <td colSpan={4} className="py-3 px-3.5 text-neutral-900 text-right uppercase tracking-wider text-[11px]">
                          Grand Total Spend:
                        </td>
                        <td className="py-3 px-3.5 text-right text-emerald-700 text-sm font-black whitespace-nowrap">
                          {formatAmount(reportData.totalSpent, reportData.currency)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Document Footer */}
              <div className="report-footer-row pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
                <span>PennyTrail Financial Journal — Confidential Personal Report</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          )}

          {/* TAB 2: EXCEL WORKBOOK VIEW */}
          {activeTab === 'excel' && reportData && (
            <div className="glass-card rounded-3xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-xl space-y-4 animate-fade-in">
              {/* Excel Sheet Selector Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Excel Workbook Preview
                    </h2>
                    <p className="text-[11px] text-neutral-400">3 Worksheets Included</p>
                  </div>
                </div>

                {/* Sheet Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 overflow-x-auto no-scrollbar shrink-0 max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveExcelSheet('transactions')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
                      activeExcelSheet === 'transactions'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    )}
                  >
                    Transactions
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveExcelSheet('categories')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
                      activeExcelSheet === 'categories'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    )}
                  >
                    Category Breakdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveExcelSheet('overview')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
                      activeExcelSheet === 'overview'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    )}
                  >
                    Overview
                  </button>
                </div>
              </div>

              {/* Sheet 1: Transactions Sheet */}
              {activeExcelSheet === 'transactions' && (
                <TableContainer>
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead>Expense Title</TableHead>
                        <TableHead className="w-44">Category</TableHead>
                        <TableHead className="w-36">Payment Method</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead align="right" className="w-36">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.expenses.map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{e.date}</TableCell>
                          <TableCell className="font-semibold whitespace-nowrap">{e.title}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                              <span>{e.categoryIcon}</span>
                              <span>{e.categoryName}</span>
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                            {PAYMENT_METHOD_LABELS[e.paymentMethod] ?? e.paymentMethod}
                          </TableCell>
                          <TableCell className="text-xs text-neutral-400 whitespace-nowrap">{e.note || '-'}</TableCell>
                          <TableCell align="right" className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                            {formatAmount(e.amount, reportData.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={5} align="right" className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                          Total Amount:
                        </TableCell>
                        <TableCell align="right" className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap text-sm">
                          {formatAmount(reportData.totalSpent, reportData.currency)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              )}

              {/* Sheet 2: Category Breakdown */}
              {activeExcelSheet === 'categories' && (
                <TableContainer>
                  <Table className="min-w-[540px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead align="center" className="w-36">Transactions Count</TableHead>
                        <TableHead align="center" className="w-36">Share Percentage</TableHead>
                        <TableHead align="right" className="w-40">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.categorySummaries.map(c => (
                        <TableRow key={c.name}>
                          <TableCell className="font-semibold whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span>{c.icon}</span>
                              <span>{c.name}</span>
                            </span>
                          </TableCell>
                          <TableCell align="center" className="font-mono text-xs whitespace-nowrap">{c.count}</TableCell>
                          <TableCell align="center" className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{c.percentage}%</TableCell>
                          <TableCell align="right" className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                            {formatAmount(c.total, reportData.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Sheet 3: Overview */}
              {activeExcelSheet === 'overview' && (
                <TableContainer className="max-w-xl">
                  <Table className="min-w-[360px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Property / Metric</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold whitespace-nowrap">Account User</TableCell>
                        <TableCell className="whitespace-nowrap">{reportData.userName} ({reportData.userEmail})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold whitespace-nowrap">Period Range</TableCell>
                        <TableCell className="whitespace-nowrap">{reportData.formattedPeriod}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold whitespace-nowrap">Total Spend</TableCell>
                        <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          {formatAmount(reportData.totalSpent, reportData.currency)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold whitespace-nowrap">Total Transactions</TableCell>
                        <TableCell className="font-mono whitespace-nowrap">{reportData.totalTransactions}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold whitespace-nowrap">Average Daily Spend</TableCell>
                        <TableCell className="font-mono tabular-nums whitespace-nowrap">{formatAmount(reportData.avgDaily, reportData.currency)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold whitespace-nowrap">Top Category</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">{reportData.topCategory}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold whitespace-nowrap">Generated At</TableCell>
                        <TableCell className="text-neutral-400 whitespace-nowrap text-xs">{reportData.generatedAt}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

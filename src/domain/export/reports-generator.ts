import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import ExcelJS from 'exceljs';
import { Expense, Category } from '@/lib/api';
import { formatAmount, getCurrencyInfo, toMajorUnits } from '@/domain/currency';
import { formatDate, PAYMENT_METHOD_LABELS } from '@/domain/formatters';
import { loadOutfitFonts } from './outfit-fonts';

export interface CategorySummaryItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface PennyTrailReportData {
  userName: string;
  userEmail: string;
  avatarEmoji?: string;
  initials: string;
  formattedPeriod: string;
  currency: string;
  currencySymbol: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  generatedAt: string;
  expenses: Array<Expense & { categoryName: string; categoryIcon: string; categoryColor: string }>;
  categorySummaries: CategorySummaryItem[];
  totalSpent: number;
  totalTransactions: number;
  avgDaily: number;
  topCategory: string;
}

function getInitials(name: string): string {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PT';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCleanDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  } catch {
    return dateStr;
  }
}

function formatGeneratedTimestamp(date: Date = new Date()): string {
  try {
    const dayMonthYear = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
    const time = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    return `${dayMonthYear}, ${time}`;
  } catch {
    return date.toLocaleString();
  }
}

export function buildReportData(
  user: { name: string; email: string; currency: string; avatarEmoji?: string },
  expenses: Expense[],
  categories: Category[],
  startDate: string,
  endDate: string,
  rangeLabel: string
): PennyTrailReportData {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const otherCat = categories.find(c => c.id === 'cat-other' || c.name === 'Other') ?? {
    id: 'cat-other',
    name: 'Other',
    icon: '📦',
    color: '#6b7280',
    isDefault: true,
  };

  const enrichedExpenses = expenses.map(e => {
    const cat = catMap.get(e.categoryId) ?? otherCat;
    return {
      ...e,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
    };
  });

  const totalSpent = enrichedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalTransactions = enrichedExpenses.length;

  // Compute category breakdown
  const catSummaryMap = new Map<string, { categoryId: string; name: string; icon: string; color: string; total: number; count: number }>();
  for (const e of enrichedExpenses) {
    const existing = catSummaryMap.get(e.categoryName);
    if (existing) {
      existing.total += e.amount;
      existing.count += 1;
    } else {
      catSummaryMap.set(e.categoryName, {
        categoryId: e.categoryId,
        name: e.categoryName,
        icon: e.categoryIcon,
        color: e.categoryColor,
        total: e.amount,
        count: 1,
      });
    }
  }

  const categorySummaries: CategorySummaryItem[] = Array.from(catSummaryMap.values())
    .map(item => ({
      ...item,
      percentage: totalSpent > 0 ? Math.round((item.total / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const uniqueDays = new Set(enrichedExpenses.map(e => e.date)).size;
  const avgDaily = uniqueDays > 0 ? Math.round(totalSpent / uniqueDays) : 0;
  const topCategory = categorySummaries[0]?.name ?? 'None';
  const currInfo = getCurrencyInfo(user.currency);

  const formattedPeriod = `${formatCleanDate(startDate)} – ${formatCleanDate(endDate)}`;
  const generatedAt = formatGeneratedTimestamp(new Date());

  return {
    userName: user.name,
    userEmail: user.email,
    avatarEmoji: user.avatarEmoji,
    initials: getInitials(user.name),
    formattedPeriod,
    currency: user.currency,
    currencySymbol: currInfo.symbol,
    startDate,
    endDate,
    rangeLabel,
    generatedAt,
    expenses: enrichedExpenses,
    categorySummaries,
    totalSpent,
    totalTransactions,
    avgDaily,
    topCategory,
  };
}

/**
 * Generates an uncropped, high-resolution PNG Data URL using an off-screen desktop clone
 * with explicit desktop flex/grid layouts and unconstrained overflow so it captures
 * cleanly at full desktop width on both desktop and mobile devices.
 */
export async function generateReportImageDataUrl(element: HTMLElement): Promise<string> {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'pennytrail-photo-export-clone';

  // Ensure clone is clean and in light theme
  clone.classList.remove('hidden');
  clone.classList.remove('dark');
  clone.querySelectorAll('.dark').forEach(el => el.classList.remove('dark'));

  // Target clean card width (900px) matching desktop report layout
  const targetWidth = 900;

  // Off-screen wrapper fixed to avoid viewport clipping or scrollbars
  const wrapper = document.createElement('div');
  wrapper.id = 'pennytrail-photo-wrapper';
  wrapper.style.position = 'fixed';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.width = '0';
  wrapper.style.height = '0';
  wrapper.style.overflow = 'hidden';
  wrapper.style.zIndex = '-99999';
  wrapper.style.opacity = '0.005';
  wrapper.style.pointerEvents = 'none';

  clone.classList.remove('max-w-4xl', 'mx-auto', 'shadow-xl', 'animate-fade-in');
  clone.style.display = 'block';
  clone.style.width = `${targetWidth}px`;
  clone.style.minWidth = `${targetWidth}px`;
  clone.style.maxWidth = `${targetWidth}px`;
  clone.style.margin = '0';
  clone.style.padding = '32px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.borderRadius = '24px';
  clone.style.overflow = 'visible';
  clone.style.boxSizing = 'border-box';
  clone.style.position = 'absolute';
  clone.style.left = '0';
  clone.style.top = '0';

  // 1. Force header row to desktop horizontal layout
  clone.querySelectorAll('.report-header-row').forEach(node => {
    const el = node as HTMLElement;
    el.style.display = 'flex';
    el.style.flexDirection = 'row';
    el.style.justifyContent = 'space-between';
    el.style.alignItems = 'center';
    el.style.gap = '16px';
    el.style.width = '100%';
  });

  // Constrain avatar image and container strictly to 48x48px square in the clone
  clone.querySelectorAll('.report-header-avatar').forEach(node => {
    const el = node as HTMLElement;
    el.style.width = '48px';
    el.style.height = '48px';
    el.style.minWidth = '48px';
    el.style.maxWidth = '48px';
    el.style.minHeight = '48px';
    el.style.maxHeight = '48px';
    el.style.aspectRatio = '1 / 1';
    el.style.borderRadius = '14px';
    el.style.flexShrink = '0';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
  });

  clone.querySelectorAll('.report-header-avatar img').forEach(node => {
    const el = node as HTMLElement;
    el.style.width = '48px';
    el.style.height = '48px';
    el.style.minWidth = '48px';
    el.style.maxWidth = '48px';
    el.style.minHeight = '48px';
    el.style.maxHeight = '48px';
    el.style.aspectRatio = '1 / 1';
    el.style.borderRadius = '14px';
    el.style.objectFit = 'cover';
    el.style.flexShrink = '0';
    el.style.display = 'block';
  });

  // Ensure right-side metadata in header stays clean and right-aligned
  clone.querySelectorAll('.report-header-meta').forEach(node => {
    const el = node as HTMLElement;
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'flex-end';
    el.style.textAlign = 'right';
    el.style.flexShrink = '0';
    el.style.width = 'auto';
  });

  // 2. Force KPI grid to 4 columns
  clone.querySelectorAll('.report-kpi-grid').forEach(node => {
    const el = node as HTMLElement;
    el.style.display = 'grid';
    el.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
    el.style.gap = '14px';
    el.style.width = '100%';
  });

  // 3. Force footer to horizontal layout
  clone.querySelectorAll('.report-footer-row').forEach(node => {
    const el = node as HTMLElement;
    el.style.display = 'flex';
    el.style.flexDirection = 'row';
    el.style.justifyContent = 'space-between';
    el.style.alignItems = 'center';
    el.style.width = '100%';
  });

  // 4. Expand all scrollable containers in the clone so nothing is cropped
  clone.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .overflow-hidden').forEach(node => {
    const el = node as HTMLElement;
    el.style.overflow = 'visible';
    el.style.width = '100%';
    el.style.maxWidth = 'none';
  });

  // 5. Ensure tables take full width
  clone.querySelectorAll('table').forEach(tbl => {
    const el = tbl as HTMLElement;
    el.style.width = '100%';
    el.style.tableLayout = 'auto';
  });

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // Wait for layout and fonts to settle
    await new Promise(r => setTimeout(r, 200));

    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      width: targetWidth,
      height: clone.scrollHeight || clone.offsetHeight,
      style: {
        overflow: 'visible',
        opacity: '1',
      },
    });

    if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 500) {
      throw new Error('Image capture returned empty data');
    }

    return dataUrl;
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Helper to ensure currency symbols (e.g. Rs. for INR, $, €) are always clearly rendered in PDF.
 */
function formatPdfCurrency(amountMinor: number, currencyCode: string): string {
  const formatted = formatAmount(amountMinor, currencyCode);
  return formatted.replace(/₹\s?/g, 'Rs. ');
}

/**
 * Downloads a high resolution PNG ("Photo") of the entire report card.
 */
export async function downloadPennyTrailPhoto(element: HTMLElement, fileName: string): Promise<void> {
  const dataUrl = await generateReportImageDataUrl(element);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 1200);
}

/**
 * Generates and downloads a vector PDF document with Google Outfit font embedding.
 */
export async function downloadPennyTrailPdf(reportData: PennyTrailReportData, fileName: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const outfitFonts = await loadOutfitFonts();
  const fontName = outfitFonts ? 'Outfit' : 'helvetica';

  if (outfitFonts) {
    try {
      doc.addFileToVFS('Outfit-Regular.ttf', outfitFonts.regular);
      doc.addFont('Outfit-Regular.ttf', 'Outfit', 'normal');

      doc.addFileToVFS('Outfit-Bold.ttf', outfitFonts.bold);
      doc.addFont('Outfit-Bold.ttf', 'Outfit', 'bold');

      doc.setFont('Outfit', 'normal');
    } catch (e) {
      console.warn('Could not register Outfit font in jsPDF:', e);
      doc.setFont('helvetica', 'normal');
    }
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 32;
  const pdfSymbol = reportData.currencySymbol === '₹' ? 'Rs.' : reportData.currencySymbol;

  // Header Banner
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 56, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(15);
  doc.text(`${reportData.userName} — Expense Statement`, margin, 27);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(236, 253, 245);
  doc.text(`Created with PennyTrail  ·  ${reportData.userEmail}`, margin, 42);

  doc.setTextColor(255, 255, 255);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(9);
  doc.text(`Period: ${reportData.formattedPeriod}`, pageWidth - margin, 27, { align: 'right' });

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(236, 253, 245);
  doc.text(`Generated: ${reportData.generatedAt}`, pageWidth - margin, 42, { align: 'right' });

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, 76, pageWidth - margin * 2, 50, 6, 6, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.text(`TOTAL SPENT (${pdfSymbol})`, margin + 20, 93);
  doc.text('TRANSACTIONS', margin + 155, 93);
  doc.text(`AVG DAILY (${pdfSymbol})`, margin + 275, 93);
  doc.text('TOP CATEGORY', margin + 385, 93);

  doc.setTextColor(16, 185, 129);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(13);
  doc.text(formatPdfCurrency(reportData.totalSpent, reportData.currency), margin + 20, 113);

  doc.setTextColor(15, 23, 42);
  doc.text(String(reportData.totalTransactions), margin + 155, 113);
  doc.text(formatPdfCurrency(reportData.avgDaily, reportData.currency), margin + 275, 113);
  doc.text(reportData.topCategory, margin + 385, 113);

  // Category Breakdown Table
  const currentY = 145;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Category Breakdown', margin, currentY);

  autoTable(doc, {
    startY: currentY + 8,
    margin: { left: margin, right: margin },
    head: [['Category', 'Transactions', 'Share (%)', `Total Spent (${pdfSymbol})`]],
    body: reportData.categorySummaries.map(c => [
      c.name,
      String(c.count),
      `${c.percentage}%`,
      formatPdfCurrency(c.total, reportData.currency),
    ]),
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: fontName,
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
    },
    styles: {
      font: fontName,
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Detailed Transactions Table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 260;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Detailed Transactions', margin, finalY + 22);

  autoTable(doc, {
    startY: finalY + 30,
    margin: { left: margin, right: margin },
    head: [['Date', 'Title & Details', 'Category', 'Payment Method', `Amount (${pdfSymbol})`]],
    body: reportData.expenses.map(e => [
      formatDate(e.date),
      e.title + (e.note ? ` (${e.note})` : ''),
      e.categoryName,
      PAYMENT_METHOD_LABELS[e.paymentMethod] ?? e.paymentMethod,
      formatPdfCurrency(e.amount, e.currency),
    ]),
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: fontName,
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
    },
    styles: {
      font: fontName,
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(fileName);
}

// ── Excel Styling Constants (Matching SplitLedger Design) ─────────────────────

const EXCEL_FONT_NAME = 'Trebuchet MS';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

const DOUBLE_BOTTOM_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'double', color: { argb: 'FF0F172A' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

/**
 * Generates and downloads a beautifully formatted multi-sheet Excel (.xlsx) workbook using ExcelJS.
 */
export async function downloadPennyTrailExcel(reportData: PennyTrailReportData, fileName: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PennyTrail';
  wb.created = new Date();

  const symbol = reportData.currencySymbol;

  // =========================================================================
  // Sheet 1: Transactions
  // =========================================================================
  const ws1 = wb.addWorksheet('Transactions', {
    views: [{ showGridLines: true }],
  });

  ws1.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Expense Title', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Payment Method', key: 'payment', width: 20 },
    { header: 'Note', key: 'note', width: 28 },
    { header: `Amount (${symbol})`, key: 'amount', width: 20 },
  ];

  // Table Header Styling
  ws1.getRow(1).height = 28;
  ws1.getRow(1).eachCell(cell => {
    cell.font = { name: EXCEL_FONT_NAME, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate-900
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = THIN_BORDER;
  });

  let rowIdx = 2;
  for (const e of reportData.expenses) {
    const isEven = rowIdx % 2 === 0;
    const bgRow = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const r = ws1.getRow(rowIdx);
    r.height = 22;

    // Date
    const cDate = r.getCell(1);
    cDate.value = e.date;
    cDate.font = { name: EXCEL_FONT_NAME, size: 9.5, color: { argb: 'FF64748B' } };
    cDate.alignment = { vertical: 'middle', horizontal: 'center' };
    cDate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    cDate.border = THIN_BORDER;

    // Title
    const cTitle = r.getCell(2);
    cTitle.value = e.title;
    cTitle.font = { name: EXCEL_FONT_NAME, size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    cTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    cTitle.border = THIN_BORDER;

    // Category
    const cCat = r.getCell(3);
    cCat.value = `${e.categoryIcon} ${e.categoryName}`;
    cCat.font = { name: EXCEL_FONT_NAME, size: 9.5, color: { argb: 'FF334155' } };
    cCat.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cCat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    cCat.border = THIN_BORDER;

    // Payment Method
    const cPay = r.getCell(4);
    cPay.value = PAYMENT_METHOD_LABELS[e.paymentMethod] ?? e.paymentMethod;
    cPay.font = { name: EXCEL_FONT_NAME, size: 9.5, color: { argb: 'FF64748B' } };
    cPay.alignment = { vertical: 'middle', horizontal: 'center' };
    cPay.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    cPay.border = THIN_BORDER;

    // Note
    const cNote = r.getCell(5);
    cNote.value = e.note ?? '';
    cNote.font = { name: EXCEL_FONT_NAME, size: 9, color: { argb: 'FF94A3B8' } };
    cNote.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cNote.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    cNote.border = THIN_BORDER;

    // Amount (with symbol)
    const cAmt = r.getCell(6);
    cAmt.value = `${symbol} ${toMajorUnits(e.amount, e.currency).toFixed(2)}`;
    cAmt.font = { name: EXCEL_FONT_NAME, size: 9.5, bold: true, color: { argb: 'FF059669' } }; // Emerald-600
    cAmt.alignment = { vertical: 'middle', horizontal: 'right' };
    cAmt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    cAmt.border = THIN_BORDER;

    rowIdx++;
  }

  // TOTAL SPEND Row
  const totalRow = ws1.getRow(rowIdx);
  totalRow.height = 26;

  ws1.mergeCells(rowIdx, 1, rowIdx, 5);
  const cTotLabel = totalRow.getCell(1);
  cTotLabel.value = 'TOTAL SPEND';
  cTotLabel.font = { name: EXCEL_FONT_NAME, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  cTotLabel.alignment = { vertical: 'middle', horizontal: 'center' };
  cTotLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  cTotLabel.border = THIN_BORDER;

  for (let c = 2; c <= 5; c++) {
    totalRow.getCell(c).border = THIN_BORDER;
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  }

  const cTotVal = totalRow.getCell(6);
  cTotVal.value = `${symbol} ${toMajorUnits(reportData.totalSpent, reportData.currency).toFixed(2)}`;
  cTotVal.font = { name: EXCEL_FONT_NAME, size: 10.5, bold: true, color: { argb: 'FF34D399' } }; // Light emerald
  cTotVal.alignment = { vertical: 'middle', horizontal: 'right' };
  cTotVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  cTotVal.border = DOUBLE_BOTTOM_BORDER;

  // =========================================================================
  // Sheet 2: Category Breakdown
  // =========================================================================
  const ws2 = wb.addWorksheet('Category Breakdown', {
    views: [{ showGridLines: true }],
  });

  ws2.columns = [
    { header: 'Category Name', key: 'name', width: 26 },
    { header: 'Transactions Count', key: 'count', width: 18 },
    { header: 'Share (%)', key: 'pct', width: 16 },
    { header: `Total Spend (${symbol})`, key: 'total', width: 22 },
  ];

  ws2.getRow(1).height = 28;
  ws2.getRow(1).eachCell(cell => {
    cell.font = { name: EXCEL_FONT_NAME, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }; // Emerald-800
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = THIN_BORDER;
  });

  let catRowIdx = 2;
  for (const c of reportData.categorySummaries) {
    const isEven = catRowIdx % 2 === 0;
    const bgRow = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const r = ws2.getRow(catRowIdx);
    r.height = 22;

    const c1 = r.getCell(1);
    c1.value = `${c.icon} ${c.name}`;
    c1.font = { name: EXCEL_FONT_NAME, size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    c1.border = THIN_BORDER;

    const c2 = r.getCell(2);
    c2.value = c.count;
    c2.font = { name: EXCEL_FONT_NAME, size: 9.5, color: { argb: 'FF475569' } };
    c2.alignment = { vertical: 'middle', horizontal: 'center' };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    c2.border = THIN_BORDER;

    const c3 = r.getCell(3);
    c3.value = `${c.percentage}%`;
    c3.font = { name: EXCEL_FONT_NAME, size: 9.5, bold: true, color: { argb: 'FF059669' } };
    c3.alignment = { vertical: 'middle', horizontal: 'center' };
    c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    c3.border = THIN_BORDER;

    const c4 = r.getCell(4);
    c4.value = `${symbol} ${toMajorUnits(c.total, reportData.currency).toFixed(2)}`;
    c4.font = { name: EXCEL_FONT_NAME, size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    c4.alignment = { vertical: 'middle', horizontal: 'right' };
    c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    c4.border = THIN_BORDER;

    catRowIdx++;
  }

  // =========================================================================
  // Sheet 3: Overview
  // =========================================================================
  const ws3 = wb.addWorksheet('Overview', {
    views: [{ showGridLines: true }],
  });

  ws3.columns = [
    { header: 'Property / Metric', key: 'metric', width: 28 },
    { header: 'Value', key: 'val', width: 34 },
  ];

  ws3.getRow(1).height = 28;
  ws3.getRow(1).eachCell(cell => {
    cell.font = { name: EXCEL_FONT_NAME, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = THIN_BORDER;
  });

  const overviewRows = [
    { metric: 'Account User', val: `${reportData.userName} (${reportData.userEmail})` },
    { metric: 'Period Range', val: reportData.formattedPeriod },
    { metric: 'Total Spend', val: `${symbol} ${toMajorUnits(reportData.totalSpent, reportData.currency).toFixed(2)}` },
    { metric: 'Total Transactions', val: String(reportData.totalTransactions) },
    { metric: 'Average Daily Spend', val: `${symbol} ${toMajorUnits(reportData.avgDaily, reportData.currency).toFixed(2)}` },
    { metric: 'Top Spending Category', val: reportData.topCategory },
    { metric: 'Generated At', val: reportData.generatedAt },
  ];

  let ovIdx = 2;
  for (const item of overviewRows) {
    const isEven = ovIdx % 2 === 0;
    const bgRow = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const r = ws3.getRow(ovIdx);
    r.height = 24;

    const c1 = r.getCell(1);
    c1.value = item.metric;
    c1.font = { name: EXCEL_FONT_NAME, size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    c1.border = THIN_BORDER;

    const c2 = r.getCell(2);
    c2.value = item.val;
    c2.font = { name: EXCEL_FONT_NAME, size: 9.5, color: { argb: 'FF334155' } };
    c2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
    c2.border = THIN_BORDER;

    ovIdx++;
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    if (document.body.contains(a)) document.body.removeChild(a);
  }, 1200);
}

/**
 * Text summary formatter for clipboard copying.
 */
export function formatShareTextSummary(reportData: PennyTrailReportData): string {
  const lines = [
    `📊 ${reportData.userName} — Expense Statement`,
    `Created with PennyTrail`,
    `📅 Period: ${reportData.formattedPeriod}`,
    `💰 Total Spent: ${formatAmount(reportData.totalSpent, reportData.currency)}`,
    `📝 Transactions: ${reportData.totalTransactions}`,
    `📈 Top Category: ${reportData.topCategory}`,
    ``,
    `📂 Category Breakdown:`,
    ...reportData.categorySummaries.map(c => `• ${c.icon} ${c.name}: ${formatAmount(c.total, reportData.currency)} (${c.percentage}%)`),
  ];
  return lines.join('\n');
}

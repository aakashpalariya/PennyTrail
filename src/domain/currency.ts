// ─── Currency formatting ───────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', minor: 100 },
  { code: 'USD', symbol: '$', name: 'US Dollar', minor: 100 },
  { code: 'EUR', symbol: '€', name: 'Euro', minor: 100 },
  { code: 'GBP', symbol: '£', name: 'British Pound', minor: 100 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', minor: 1 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', minor: 100 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', minor: 100 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', minor: 100 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', minor: 100 },
];

export function getCurrencyInfo(code: string) {
  return SUPPORTED_CURRENCIES.find(c => c.code === code) ?? SUPPORTED_CURRENCIES[0];
}

/** Convert major units (e.g. 150.50) → minor units (15050 paise) */
export function toMinorUnits(major: number, currencyCode: string): number {
  const info = getCurrencyInfo(currencyCode);
  return Math.round(major * info.minor);
}

/** Convert minor units (15050 paise) → major units (150.50) */
export function toMajorUnits(minor: number, currencyCode: string): number {
  const info = getCurrencyInfo(currencyCode);
  return minor / info.minor;
}

/** Format minor units as a display string e.g. ₹1,50,500.00 */
export function formatAmount(minor: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const major = minor / info.minor;

  if (currencyCode === 'INR') {
    // Indian numbering system
    return info.symbol + major.toLocaleString('en-IN', {
      minimumFractionDigits: info.minor === 1 ? 0 : 2,
      maximumFractionDigits: info.minor === 1 ? 0 : 2,
    });
  }

  return info.symbol + major.toLocaleString('en-US', {
    minimumFractionDigits: info.minor === 1 ? 0 : 2,
    maximumFractionDigits: info.minor === 1 ? 0 : 2,
  });
}

/** Format as compact e.g. ₹1.2K, ₹4.5L */
export function formatAmountCompact(minor: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const major = minor / info.minor;

  if (major >= 10_00_000) return info.symbol + (major / 10_00_000).toFixed(1) + 'Cr';
  if (major >= 1_00_000)  return info.symbol + (major / 1_00_000).toFixed(1) + 'L';
  if (major >= 1_000)     return info.symbol + (major / 1_000).toFixed(1) + 'K';
  return formatAmount(minor, currencyCode);
}

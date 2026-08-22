const DEFAULT_LOCALE = 'tr-TR';
const DEFAULT_CURRENCY = 'TRY';

export function formatTryCurrency(
  value: number,
  locale: string = DEFAULT_LOCALE,
  currency: string = DEFAULT_CURRENCY
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${value} TL`;
  }
}

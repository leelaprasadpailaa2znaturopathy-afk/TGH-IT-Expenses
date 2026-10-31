/** Fetch a rate from the authenticated server. A zero rate means configure one or enter it manually. */
export async function fetchExchangeRateForDate(dateStr: string): Promise<number> {
  if (!dateStr) return 0;
  const response = await fetch('/api/exchange-rate?date=' + encodeURIComponent(dateStr));
  if (!response.ok) throw new Error('Could not load exchange rate.');
  const result = await response.json();
  return typeof result.rate === 'number' ? result.rate : 0;
}

export async function calculateUsdExpenseByPaidDate(usdAmount: number, paidDate: string, manualOverrideRate?: number) {
  const rate = manualOverrideRate && manualOverrideRate > 0 ? +manualOverrideRate.toFixed(2) : await fetchExchangeRateForDate(paidDate);
  return { rate, inrAmount: +(usdAmount * rate).toFixed(2), isCustomRate: !!manualOverrideRate, date: paidDate };
}

/**
 * Format currency with international locale and symbols
 */
export function formatCurrencyValue(amount: number, currency: 'INR' | 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

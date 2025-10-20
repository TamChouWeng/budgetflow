import type { Currency, DateRange } from '../types/models'
import { formatDateTz } from './dates'

const currencyLocales: Record<Currency, string> = {
  MYR: 'ms-MY',
  USD: 'en-US',
}

export const formatCurrency = (
  value: number,
  currency: Currency,
  options?: Intl.NumberFormatOptions,
) => {
  try {
    return new Intl.NumberFormat(currencyLocales[currency], {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export const formatPercent = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, ...options }).format(value)

export const formatDateRangeLabel = (range: DateRange) => {
  if (range.preset && range.preset !== 'CUSTOM') {
    return range.preset
  }
  return `${formatDateTz(range.from)} → ${formatDateTz(range.to)}`
}

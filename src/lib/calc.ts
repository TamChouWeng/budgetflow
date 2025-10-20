import { differenceInDays, parseISO } from 'date-fns'
import type {
  AppSettings,
  Category,
  Currency,
  DateRange,
  FixedDepositPosition,
  FxRate,
  Holding,
  PriceQuote,
  Transaction,
} from '../types/models'
import { isWithinRange, zonedNow } from './dates'

export const getFxRateKey = (base: Currency, quote: Currency) => `${base}_${quote}`

export const toFxRecord = (rates: FxRate[]) =>
  rates.reduce<Record<string, FxRate>>((acc, rate) => {
    acc[getFxRateKey(rate.base, rate.quote)] = rate
    return acc
  }, {})

export const convertCurrency = (
  value: number,
  from: Currency,
  to: Currency,
  fxRates: Record<string, FxRate>,
) => {
  if (from === to) return value
  const direct = fxRates[getFxRateKey(from, to)]
  if (direct) {
    return value * direct.rate
  }
  const inverse = fxRates[getFxRateKey(to, from)]
  if (inverse) {
    return value / inverse.rate
  }
  return value
}

export interface HoldingMetrics {
  marketValue: number
  costBasis: number
  pnlValue: number
  pnlPercent: number
  lastPrice: number
  lastPriceCurrency: Currency
}

export const calculateHoldingMetrics = (
  holding: Holding,
  quote: PriceQuote | undefined,
  baseCurrency: Currency,
  fxRates: Record<string, FxRate>,
): HoldingMetrics => {
  const effectiveQuote = quote ?? holding.lastQuote
  const price = effectiveQuote?.price ?? holding.avgCost
  const priceCurrency = effectiveQuote?.currency ?? holding.holdingCurrency
  const marketValue = convertCurrency(
    price * holding.quantity,
    priceCurrency,
    baseCurrency,
    fxRates,
  )
  const costBasis = convertCurrency(
    holding.avgCost * holding.quantity,
    holding.holdingCurrency,
    baseCurrency,
    fxRates,
  )
  const pnlValue = marketValue - costBasis
  const pnlPercent = costBasis !== 0 ? pnlValue / costBasis : 0
  return {
    marketValue,
    costBasis,
    pnlValue,
    pnlPercent,
    lastPrice: price,
    lastPriceCurrency: priceCurrency,
  }
}

export interface CategorySummary {
  category: Category
  amount: number
}

export const sumTransactionsByCategory = (
  transactions: Transaction[],
  range: DateRange,
  baseCurrency: Currency,
  fxRates: Record<string, FxRate>,
) => {
  const summary: Record<Category, number> = {
    stocks: 0,
    crypto: 0,
    indexFund: 0,
    reit: 0,
    fixedDeposit: 0,
    epf: 0,
    investment: 0,
    other: 0,
    property: 0,
    business: 0,
  }
  transactions.forEach((tx) => {
    if (!isWithinRange(tx.date, range)) return
    summary[tx.category] += convertCurrency(tx.amount, tx.currency, baseCurrency, fxRates)
  })
  return summary
}

export interface AllocationInput {
  category: string
  value: number
  label?: string
}

export interface AllocationSlice extends AllocationInput {
  percentage: number
}

export const calculateAllocation = (
  inputs: AllocationInput[],
): AllocationSlice[] => {
  const sum = inputs.reduce((acc, item) => acc + item.value, 0)
  if (sum === 0) {
    return inputs.map((item) => ({ ...item, percentage: 0 }))
  }
  return inputs.map((item) => ({
    ...item,
    percentage: item.value / sum,
  }))
}

export interface HoldingWithMetrics extends Holding {
  metrics: HoldingMetrics
}

export const enrichHoldings = (
  holdings: Holding[],
  quotes: Record<string, PriceQuote>,
  baseCurrency: Currency,
  fxRates: Record<string, FxRate>,
): HoldingWithMetrics[] =>
  holdings.map((holding) => ({
    ...holding,
    metrics: calculateHoldingMetrics(
      holding,
      quotes[holding.symbol],
      baseCurrency,
      fxRates,
    ),
  }))

export interface DashboardKpis {
  totalMarketValue: number
  totalCostBasis: number
  totalPnlValue: number
  totalPnlPercent: number
  businessSpend: number
}

export const calculateDashboardKpis = (
  holdings: Holding[],
  quotes: Record<string, PriceQuote>,
  transactions: Transaction[],
  range: DateRange,
  settings: AppSettings,
  fxRates: Record<string, FxRate>,
): DashboardKpis => {
  const enriched = enrichHoldings(holdings, quotes, settings.baseCurrency, fxRates)
  const totalMarketValue = enriched.reduce(
    (acc, holding) => acc + holding.metrics.marketValue,
    0,
  )
  const totalCostBasis = enriched.reduce(
    (acc, holding) => acc + holding.metrics.costBasis,
    0,
  )
  const totalPnlValue = totalMarketValue - totalCostBasis
  const totalPnlPercent = totalCostBasis
    ? totalPnlValue / totalCostBasis
    : 0

  const businessTotals = sumTransactionsByCategory(
    transactions.filter((tx) => tx.category === 'business'),
    range,
    settings.baseCurrency,
    fxRates,
  )

  return {
    totalMarketValue,
    totalCostBasis,
    totalPnlValue,
    totalPnlPercent,
    businessSpend: businessTotals.business,
  }
}

export const calculateFixedDepositAccrual = (
  position: FixedDepositPosition,
  baseCurrency: Currency,
  fxRates: Record<string, FxRate>,
  asOf: Date = zonedNow(),
) => {
  const start = parseISO(position.startDate)
  const end = parseISO(position.maturityDate)
  const targetEnd = asOf > end ? end : asOf
  const daysElapsed = Math.max(differenceInDays(targetEnd, start), 0)
  const accrued = position.principal * (position.ratePct / 100) * (daysElapsed / 365)
  const currentValue = position.principal + accrued
  const principalBase = convertCurrency(
    position.principal,
    position.currency,
    baseCurrency,
    fxRates,
  )
  const accruedBase = convertCurrency(
    accrued,
    position.currency,
    baseCurrency,
    fxRates,
  )
  const currentValueBase = convertCurrency(
    currentValue,
    position.currency,
    baseCurrency,
    fxRates,
  )
  return {
    accrued,
    currentValue,
    principalBase,
    accruedBase,
    currentValueBase,
  }
}

export interface BusinessBreakdownRow {
  subcategory: string
  total: number
  count: number
}

export const summarizeBusinessBySubcategory = (
  transactions: Transaction[],
  range: DateRange,
  baseCurrency: Currency,
  fxRates: Record<string, FxRate>,
) => {
  const summary = new Map<string, BusinessBreakdownRow>()
  transactions.forEach((transaction) => {
    if (transaction.category !== 'business') return
    if (!isWithinRange(transaction.date, range)) return
    const key = transaction.subcategory ?? 'Uncategorised'
    const current = summary.get(key) ?? { subcategory: key, total: 0, count: 0 }
    const amount = convertCurrency(
      transaction.amount,
      transaction.currency,
      baseCurrency,
      fxRates,
    )
    summary.set(key, { subcategory: key, total: current.total + amount, count: current.count + 1 })
  })
  return Array.from(summary.values()).sort((a, b) => b.total - a.total)
}



export interface PropertyAllocationRow {
  name: string
  value: number
}

export const sumPropertyByName = (
  transactions: Transaction[],
  range: DateRange,
  baseCurrency: Currency,
  fxRates: Record<string, FxRate>,
): PropertyAllocationRow[] => {
  const summary = new Map<string, number>()
  transactions.forEach((transaction) => {
    if (transaction.category !== 'property') return
    if (!isWithinRange(transaction.date, range)) return
    const key = transaction.subcategory ?? transaction.name ?? 'Property'
    const amount = convertCurrency(
      transaction.amount,
      transaction.currency,
      baseCurrency,
      fxRates,
    )
    summary.set(key, (summary.get(key) ?? 0) + amount)
  })
  return Array.from(summary.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export interface CategoryBreakdownRow {
  name: string
  value: number
  count: number
}

export const sumTransactionsBySubcategory = (
  transactions: Transaction[],
  range: DateRange,
  baseCurrency: Currency,
  fxRates: Record<string, FxRate>,
  category: Category,
): CategoryBreakdownRow[] => {
  const summary = new Map<string, CategoryBreakdownRow>()
  transactions.forEach((transaction) => {
    if (transaction.category !== category) return
    if (!isWithinRange(transaction.date, range)) return
    const key = transaction.subcategory ?? transaction.name ?? category
    const current = summary.get(key) ?? { name: key, value: 0, count: 0 }
    const amount = convertCurrency(transaction.amount, transaction.currency, baseCurrency, fxRates)
    summary.set(key, { name: key, value: current.value + amount, count: current.count + 1 })
  })
  return Array.from(summary.values()).sort((a, b) => b.value - a.value)
}




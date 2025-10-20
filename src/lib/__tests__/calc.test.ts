import { describe, expect, it } from 'vitest'
import {
  calculateFixedDepositAccrual,
  calculateHoldingMetrics,
  convertCurrency,
  getFxRateKey,
  summarizeBusinessBySubcategory,
} from '../calc'
import type {
  FixedDepositPosition,
  FxRate,
  Holding,
  PriceQuote,
  Transaction,
} from '../../types/models'

const makeFxMap = (rates: FxRate[]) =>
  rates.reduce<Record<string, FxRate>>((acc, rate) => {
    acc[getFxRateKey(rate.base, rate.quote)] = rate
    return acc
  }, {})

describe('convertCurrency', () => {
  const fxRates = makeFxMap([
    { base: 'USD', quote: 'MYR', rate: 4.5, asOf: new Date().toISOString() },
  ])

  it('converts using direct rate', () => {
    expect(convertCurrency(10, 'USD', 'MYR', fxRates)).toBeCloseTo(45)
  })

  it('converts using inverse rate when needed', () => {
    expect(convertCurrency(45, 'MYR', 'USD', fxRates)).toBeCloseTo(10)
  })
})

describe('calculateHoldingMetrics', () => {
  const fxRates = makeFxMap([
    { base: 'USD', quote: 'MYR', rate: 4.5, asOf: new Date().toISOString() },
  ])
  const holding: Holding = {
    id: 'h1',
    category: 'stocks',
    symbol: 'AAPL',
    quantity: 10,
    avgCost: 100,
    holdingCurrency: 'USD',
  }
  const quote: PriceQuote = {
    symbol: 'AAPL',
    price: 120,
    currency: 'USD',
    asOf: new Date().toISOString(),
  }

  it('computes market value and PnL in base currency', () => {
    const metrics = calculateHoldingMetrics(holding, quote, 'MYR', fxRates)
    expect(metrics.marketValue).toBeCloseTo(120 * 10 * 4.5)
    expect(metrics.costBasis).toBeCloseTo(100 * 10 * 4.5)
    expect(metrics.pnlValue).toBeCloseTo((120 - 100) * 10 * 4.5)
    expect(metrics.pnlPercent).toBeCloseTo(0.2)
  })
})

describe('calculateFixedDepositAccrual', () => {
  const fxRates = makeFxMap([
    { base: 'MYR', quote: 'USD', rate: 0.22, asOf: new Date().toISOString() },
  ])

  it('computes accrued interest and value', () => {
    const position: FixedDepositPosition = {
      id: 'fd1',
      bank: 'Bank A',
      principal: 10_000,
      ratePct: 3.5,
      startDate: '2025-01-01T00:00:00.000Z',
      maturityDate: '2025-07-01T00:00:00.000Z',
      currency: 'MYR',
    }

    const accrual = calculateFixedDepositAccrual(
      position,
      'USD',
      fxRates,
      new Date('2025-04-01T00:00:00.000Z'),
    )
    expect(accrual.currentValue).toBeGreaterThan(position.principal)
    expect(accrual.accrued).toBeGreaterThan(0)
    expect(accrual.currentValueBase).toBeCloseTo(accrual.currentValue * 0.22)
  })
})

describe('summarizeBusinessBySubcategory', () => {
  const fxRates = makeFxMap([
    { base: 'USD', quote: 'MYR', rate: 4.0, asOf: new Date().toISOString() },
  ])

  it('aggregates transactions by subcategory', () => {
    const transactions: Transaction[] = [
      {
        id: 't1',
        category: 'business',
        subcategory: 'Marketing',
        amount: 100,
        currency: 'USD',
        date: '2025-01-05T00:00:00.000Z',
      },
      {
        id: 't2',
        category: 'business',
        subcategory: 'Operations',
        amount: 500,
        currency: 'MYR',
        date: '2025-01-10T00:00:00.000Z',
      },
      {
        id: 't3',
        category: 'business',
        subcategory: 'Marketing',
        amount: 250,
        currency: 'MYR',
        date: '2025-01-20T00:00:00.000Z',
      },
    ]

    const rows = summarizeBusinessBySubcategory(
      transactions,
      { from: '2025-01-01T00:00:00.000Z', to: '2025-01-31T00:00:00.000Z' },
      'MYR',
      fxRates,
    )

    const marketing = rows.find((row) => row.subcategory === 'Marketing')
    const operations = rows.find((row) => row.subcategory === 'Operations')

    expect(marketing?.total).toBeCloseTo(100 * 4 + 250)
    expect(marketing?.count).toBe(2)
    expect(operations?.total).toBeCloseTo(500)
  })
})

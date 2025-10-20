import { useMemo, useState } from 'react'
import AddInvestmentForm from '../components/forms/AddInvestmentForm'
import DateRangePicker from '../components/DateRangePicker'
import HoldingsTable from '../components/tables/HoldingsTable'
import PageHeader from '../components/PageHeader'
import { useDateRange } from '../hooks/useDateRange'
import { usePrices } from '../hooks/usePrices'
import {
  calculateAllocation,
  calculateFixedDepositAccrual,
  enrichHoldings,
  sumTransactionsByCategory,
  sumTransactionsBySubcategory,
} from '../lib/calc'
import { useBudgetStore } from '../lib/datastore'
import { formatCurrency, formatPercent } from '../lib/format'
import AllocationPie from '../components/AllocationPie'
import type { HoldingWithMetrics } from '../lib/calc'
import type { PriceQuote, Category } from '../types/models'
const BASE_PATH = '/.netlify/functions'

type AllocationView =
  | 'summary'
  | 'stocks'
  | 'crypto'
  | 'indexFund'
  | 'reit'
  | 'other'
  | 'epf'

const InvestmentsPage = () => {
  const holdings = useBudgetStore((state) => state.holdings)
  const transactions = useBudgetStore((state) => state.transactions)
  const fixedDeposits = useBudgetStore((state) => state.fixedDeposits)
  const priceQuotes = useBudgetStore((state) => state.priceQuotes)
  const fxRates = useBudgetStore((state) => state.fxRates)
  const settings = useBudgetStore((state) => state.settings)
  const recordQuotes = useBudgetStore((state) => state.recordQuotes)
  const { range, setRange } = useDateRange()
  const [allocationView, setAllocationView] = useState<AllocationView>('summary')

  const symbols = useMemo(() => holdings.map((holding) => holding.symbol), [holdings])
  const { isFetching, refetch } = usePrices(symbols, {
    enabled: symbols.length > 0,
    refetchInterval: 300_000,
  })

  const enrichedHoldings = useMemo(
    () => enrichHoldings(holdings, priceQuotes, settings.baseCurrency, fxRates),
    [holdings, priceQuotes, settings.baseCurrency, fxRates],
  )


  const [refreshingIds, setRefreshingIds] = useState<string[]>([])

  const handleRefreshHolding = async (holding: HoldingWithMetrics) => {
    setRefreshingIds((prev) => [...prev, holding.id])
    try {
      const params = new URLSearchParams({
        symbol: holding.symbol,
        vendor: settings.vendor,
      })
      const response = await fetch(`${BASE_PATH}/price?${params.toString()}`, {
        headers: settings.vendorApiKey ? { 'x-api-key': settings.vendorApiKey } : undefined,
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as PriceQuote[]
      recordQuotes(data)
    } catch (error) {
      console.error('Unable to refresh quote', error)
    } finally {
      setRefreshingIds((prev) => prev.filter((id) => id !== holding.id))
    }
  }

  
  const summaryAllocation = useMemo(() => {
    const spendTotals = sumTransactionsByCategory(
      transactions,
      range,
      settings.baseCurrency,
      fxRates,
    )

    const totals: Record<
      | 'stocks'
      | 'crypto'
      | 'indexFund'
      | 'reit'
      | 'fixedDeposit'
      | 'property'
      | 'other'
      | 'epf'
      | 'business',
      number
    > = {
      stocks: 0,
      crypto: 0,
      indexFund: 0,
      reit: 0,
      fixedDeposit: 0,
      property: spendTotals.property,
      other: spendTotals.other,
      epf: spendTotals.epf,
      business: spendTotals.business,
    }

    enrichedHoldings.forEach((holding) => {
      if (holding.category in totals) {
        const key = holding.category as keyof typeof totals
        totals[key] += holding.metrics.marketValue
      }
    })

    fixedDeposits.forEach((position) => {
      const fd = calculateFixedDepositAccrual(position, settings.baseCurrency, fxRates)
      totals.fixedDeposit += fd.currentValueBase
    })

    const items = [
      { category: 'stocks', value: totals.stocks },
      { category: 'crypto', value: totals.crypto },
      { category: 'indexFund', value: totals.indexFund },
      { category: 'reit', value: totals.reit },
      { category: 'fixedDeposit', value: totals.fixedDeposit },
      { category: 'property', value: totals.property },
      { category: 'other', value: totals.other },
      { category: 'epf', value: totals.epf },
      { category: 'business', value: totals.business },
    ]

    return calculateAllocation(items.filter((item) => item.value > 0))
  }, [transactions, range, settings.baseCurrency, fxRates, enrichedHoldings, fixedDeposits])

  const allocationOptions: Array<{ value: AllocationView; label: string }> = [
    { value: 'summary', label: 'Overall' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'indexFund', label: 'Index Funds' },
    { value: 'reit', label: 'REITs' },
    { value: 'other', label: 'Other' },
    { value: 'epf', label: 'EPF' },
  ]

  const allocation = useMemo(() => {
    if (allocationView === 'summary') {
      return summaryAllocation
    }

    const items: { category: string; value: number; label?: string }[] = []
    const addSlice = (category: string, value: number, label?: string) => {
      if (value > 0) {
        items.push({ category, value, label })
      }
    }

    const holdingCategories: AllocationView[] = ['stocks', 'crypto', 'indexFund', 'reit']
    if (holdingCategories.includes(allocationView)) {
      enrichedHoldings
        .filter((holding) => holding.category === allocationView)
        .forEach((holding) => {
          addSlice(holding.id, holding.metrics.marketValue, holding.name ?? holding.symbol)
        })
    }

    const transactionCategories: AllocationView[] = ['other', 'epf']
    if (transactionCategories.includes(allocationView)) {
      sumTransactionsBySubcategory(
        transactions,
        range,
        settings.baseCurrency,
        fxRates,
        allocationView as Category,
      ).forEach(({ name, value }) => {
        const existingLabelMatch = items.find(
          (item) => item.label === name || item.category === name,
        )
        addSlice(
          existingLabelMatch ? `${allocationView}-tx-${name}` : name,
          value,
          existingLabelMatch ? `${name} (cash flow)` : name,
        )
      })
    }

    return calculateAllocation(items)
  }, [
    allocationView,
    enrichedHoldings,
    summaryAllocation,
    transactions,
    range,
    settings.baseCurrency,
    fxRates,
  ])

  return (
    <section className="space-y-8">
      <PageHeader
        title="Investments"
        description="Manage holdings, deposits, and current allocation across asset classes."
      />
      <DateRangePicker value={range} onChange={setRange} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AddInvestmentForm />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Allocation snapshot</h2>
              <p className="text-sm text-slate-400">
                Market value in {settings.baseCurrency}. Choose a category to drill into holdings or cash flows.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-right lg:text-left">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">View</span>
              <select
                value={allocationView}
                onChange={(event) => setAllocationView(event.target.value as AllocationView)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              >
                {allocationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AllocationPie data={allocation} currency={settings.baseCurrency} />
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {allocation.map((slice) => (
              <li
                key={`${slice.category}-${slice.label ?? 'total'}`}
                className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-2"
              >
                <span className="font-medium capitalize">{slice.label ?? slice.category}</span>
                <span className="text-right text-slate-300">
                  {formatCurrency(slice.value, settings.baseCurrency)} | {formatPercent(slice.percentage)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <HoldingsTable
        holdings={enrichedHoldings}
        baseCurrency={settings.baseCurrency}
        isRefreshing={isFetching}
        refreshingIds={refreshingIds}
        onRefreshHolding={handleRefreshHolding}
        onRefreshAll={() => refetch()}
      />    </section>
  )
}

export default InvestmentsPage


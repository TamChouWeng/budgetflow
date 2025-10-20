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
} from '../lib/calc'
import { useBudgetStore } from '../lib/datastore'
import { formatCurrency, formatPercent } from '../lib/format'
import AllocationPie from '../components/AllocationPie'
import type { HoldingWithMetrics } from '../lib/calc'
import type { PriceQuote } from '../types/models'
const BASE_PATH = '/.netlify/functions'

const InvestmentsPage = () => {
  const holdings = useBudgetStore((state) => state.holdings)
  const transactions = useBudgetStore((state) => state.transactions)
  const fixedDeposits = useBudgetStore((state) => state.fixedDeposits)
  const priceQuotes = useBudgetStore((state) => state.priceQuotes)
  const fxRates = useBudgetStore((state) => state.fxRates)
  const settings = useBudgetStore((state) => state.settings)
  const recordQuotes = useBudgetStore((state) => state.recordQuotes)
  const { range, setRange } = useDateRange()

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

  
  const allocation = useMemo(() => {
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
      | 'investment'
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
      investment: spendTotals.investment,
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
      { category: 'investment', value: totals.investment, label: 'Other' },
      { category: 'other', value: totals.other },
      { category: 'epf', value: totals.epf },
      { category: 'business', value: totals.business },
    ]

    return calculateAllocation(items.filter((item) => item.value > 0))
  }, [transactions, range, settings.baseCurrency, fxRates, enrichedHoldings, fixedDeposits])  const transactionsInRange = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.date >= range.from && transaction.date <= range.to,
      ),
    [transactions, range],
  )

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
          <h2 className="text-lg font-semibold text-white">Allocation snapshot</h2>
          <p className="text-sm text-slate-400">
            Market value plus current fixed deposit balances in {settings.baseCurrency}.
          </p>
          <AllocationPie data={allocation} currency={settings.baseCurrency} />
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {allocation.map((slice) => (
              <li
                key={`${slice.category}-${slice.label ?? 'total'}`}
                className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-2"
              >
                <span className="font-medium capitalize">{slice.label ?? slice.category}</span>
                <span className="text-right text-slate-300">
                  {formatCurrency(slice.value, settings.baseCurrency)} ·{' '}
                  {formatPercent(slice.percentage)}
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
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Transactions in range</h2>
        <p className="text-sm text-slate-400">
          Includes all investment-related cash flows across the selected period.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {transactionsInRange
                .filter((transaction) => transaction.category !== 'business')
                .map((transaction) => {
                  const converted =
                    sumTransactionsByCategory([transaction], range, settings.baseCurrency, fxRates)[
                      transaction.category
                    ] ?? 0
                  return (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{transaction.name ?? '—'}</td>
                      <td className="px-4 py-3 uppercase text-slate-400">{transaction.category}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {formatCurrency(converted, settings.baseCurrency)}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
          {transactionsInRange.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-8 text-center text-sm text-slate-400">
              No transactions recorded in this range.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default InvestmentsPage















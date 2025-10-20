import { useMemo } from 'react'
import AllocationPie from '../components/AllocationPie'
import DateRangePicker from '../components/DateRangePicker'
import KpiCard from '../components/KpiCard'
import PageHeader from '../components/PageHeader'
import SaveToFileButton from '../components/SaveToFileButton'
import { useDateRange } from '../hooks/useDateRange'
import { useFxRate, usePrices } from '../hooks/usePrices'
import {
  calculateAllocation,
  calculateDashboardKpis,
  calculateFixedDepositAccrual,
  enrichHoldings,
  sumTransactionsByCategory,
} from '../lib/calc'
import { useBudgetStore } from '../lib/datastore'
import { formatCurrency, formatPercent } from '../lib/format'

const DashboardPage = () => {
  const holdings = useBudgetStore((state) => state.holdings)
  const transactions = useBudgetStore((state) => state.transactions)
  const fixedDeposits = useBudgetStore((state) => state.fixedDeposits)
  const priceQuotes = useBudgetStore((state) => state.priceQuotes)
  const fxRates = useBudgetStore((state) => state.fxRates)
  const settings = useBudgetStore((state) => state.settings)
  const { range, setRange } = useDateRange()

  const symbols = useMemo(() => holdings.map((holding) => holding.symbol), [holdings])

  const { isFetching: refreshingPrices, refetch: refetchPrices } = usePrices(symbols, {
    enabled: symbols.length > 0,
    refetchInterval: 120_000,
  })

  const secondaryCurrency = settings.baseCurrency === 'MYR' ? 'USD' : 'MYR'
  useFxRate(secondaryCurrency, settings.baseCurrency, {
    enabled: secondaryCurrency !== settings.baseCurrency,
    refetchInterval: 300_000,
  })

  const enrichedHoldings = useMemo(
    () => enrichHoldings(holdings, priceQuotes, settings.baseCurrency, fxRates),
    [holdings, priceQuotes, settings.baseCurrency, fxRates],
  )

  const kpis = useMemo(
    () =>
      calculateDashboardKpis(
        holdings,
        priceQuotes,
        transactions,
        range,
        settings,
        fxRates,
      ),
    [holdings, priceQuotes, transactions, range, settings, fxRates],
  )
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
      const fd = calculateFixedDepositAccrual(
        position,
        settings.baseCurrency,
        fxRates,
      )
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
  }, [transactions, range, settings.baseCurrency, fxRates, enrichedHoldings, fixedDeposits])

  return (
    <section className="space-y-8">
      <PageHeader
        title="Portfolio dashboard"
        description="Monitor portfolio value, spending mix, and refresh quotes on demand."
        actions={<SaveToFileButton />}
      />
      <DateRangePicker value={range} onChange={setRange} />
      <div className="grid gap-5 lg:grid-cols-4">
        <KpiCard
          label="Market value"
          value={formatCurrency(kpis.totalMarketValue, settings.baseCurrency)}
          helper="Across holdings and fixed deposits"
        />
        <KpiCard
          label="Cost basis"
          value={formatCurrency(kpis.totalCostBasis, settings.baseCurrency)}
          helper="Invested capital"
        />
        <KpiCard
          label="Unrealized PnL"
          value={formatCurrency(kpis.totalPnlValue, settings.baseCurrency)}
          helper="PnL vs. cost basis"
          trend={{
            label: formatPercent(kpis.totalPnlPercent),
            variant: kpis.totalPnlValue >= 0 ? 'positive' : 'negative',
          }}
        />
        <KpiCard
          label="Business spend"
          value={formatCurrency(kpis.businessSpend, settings.baseCurrency)}
          helper={`${allocation.find((item) => item.category === 'business')?.percentage
            ? formatPercent(
                allocation.find((item) => item.category === 'business')!.percentage,
              )
            : '0%'
          } of period outflow`}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Category allocation</h2>
              <p className="text-sm text-slate-400">Based on holdings and cash outflows</p>
            </div>
            <button
              type="button"
              onClick={() => refetchPrices()}
              disabled={refreshingPrices}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-brand-500 hover:text-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={`h-3 w-3 rounded-full ${refreshingPrices ? 'animate-ping bg-brand-300' : 'bg-emerald-400/80'}`}
              />
              Refresh quotes
            </button>
          </div>
          <AllocationPie data={allocation} currency={settings.baseCurrency} />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Latest activity</h2>
          <p className="text-sm text-slate-400">
            Transactions in the selected range. Import statements to seed more data.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {transactions
              .filter((transaction) => transaction.date >= range.from && transaction.date <= range.to)
              .slice(-5)
              .reverse()
              .map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{transaction.name ?? transaction.category}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(transaction.date).toLocaleDateString()} ·{' '}
                      {transaction.category.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(
                        sumTransactionsByCategory([transaction], range, settings.baseCurrency, fxRates)[
                          transaction.category
                        ],
                        settings.baseCurrency,
                      )}
                    </p>
                  </div>
                </li>
              ))}
            {transactions.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-800/80 bg-slate-900/40 px-4 py-6 text-center text-slate-400">
                No transactions recorded yet.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage






import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import DateRangePicker from '../components/DateRangePicker'
import { useDateRange } from '../hooks/useDateRange'
import { useBudgetStore } from '../lib/datastore'
import { formatCurrency } from '../lib/format'
import { sumPropertyByName, sumTransactionsByCategory } from '../lib/calc'

const PropertyPage = () => {
  const transactions = useBudgetStore((state) => state.transactions)
  const fxRates = useBudgetStore((state) => state.fxRates)
  const settings = useBudgetStore((state) => state.settings)
  const { range, setRange } = useDateRange()

  const propertySummary = useMemo(
    () => sumTransactionsByCategory(transactions, range, settings.baseCurrency, fxRates),
    [transactions, range, settings.baseCurrency, fxRates],
  )

  const propertyBreakdown = useMemo(
    () => sumPropertyByName(transactions, range, settings.baseCurrency, fxRates),
    [transactions, range, settings.baseCurrency, fxRates],
  )

  const transactionsInRange = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.category === 'property' &&
          transaction.date >= range.from &&
          transaction.date <= range.to,
      ),
    [transactions, range],
  )

  const totalPropertyValue = propertyBreakdown.reduce((acc, row) => acc + row.value, 0)

  return (
    <section className="space-y-8">
      <PageHeader
        title="Property"
        description="Track property-related cash flows and allocations across your portfolio."
      />
      <DateRangePicker value={range} onChange={setRange} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Property total</h2>
          <p className="mt-3 text-3xl font-bold text-white">
            {formatCurrency(propertySummary.property, settings.baseCurrency)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Total value in {settings.baseCurrency} across the selected period.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Average per property</h2>
          <p className="mt-3 text-3xl font-bold text-white">
            {propertyBreakdown.length > 0
              ? formatCurrency(totalPropertyValue / propertyBreakdown.length, settings.baseCurrency)
              : formatCurrency(0, settings.baseCurrency)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Mean allocation per property in the selected range.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Properties tracked</h2>
          <p className="mt-3 text-3xl font-bold text-white">{propertyBreakdown.length}</p>
          <p className="mt-2 text-sm text-slate-400">
            Unique properties with recorded transactions in this period.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Allocation by property</h2>
        <p className="text-sm text-slate-400">
          Converted to {settings.baseCurrency}. Totals reflect amounts within the selected range.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Property</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {propertyBreakdown.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-3 font-semibold text-white">{row.name}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(row.value, settings.baseCurrency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {propertyBreakdown.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-8 text-center text-sm text-slate-400">
              No property transactions recorded in this range.
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Transactions</h2>
        <p className="text-sm text-slate-400">
          Detailed property cash flows between {new Date(range.from).toLocaleDateString()} and{' '}
          {new Date(range.to).toLocaleDateString()}.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {transactionsInRange.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{transaction.name}</td>
                  <td className="px-4 py-3 text-slate-300">{transaction.description ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactionsInRange.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-8 text-center text-sm text-slate-400">
              No individual property transactions in this range.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default PropertyPage

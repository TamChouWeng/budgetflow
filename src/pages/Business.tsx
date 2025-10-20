import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import AddBusinessExpenseForm from '../components/forms/AddBusinessExpenseForm'
import DateRangePicker from '../components/DateRangePicker'
import PageHeader from '../components/PageHeader'
import { useDateRange } from '../hooks/useDateRange'
import {
  summarizeBusinessBySubcategory,
  sumTransactionsByCategory,
} from '../lib/calc'
import { useBudgetStore } from '../lib/datastore'
import { formatCurrency, formatPercent } from '../lib/format'

const palette = ['#38bdf8', '#f97316', '#a855f7', '#22c55e', '#facc15', '#fb7185']

const BusinessPage = () => {
  const transactions = useBudgetStore((state) => state.transactions)
  const fxRates = useBudgetStore((state) => state.fxRates)
  const settings = useBudgetStore((state) => state.settings)
  const { range, setRange } = useDateRange()

  const businessTransactions = transactions.filter(
    (transaction) =>
      transaction.category === 'business' &&
      transaction.date >= range.from &&
      transaction.date <= range.to,
  )

  const breakdown = summarizeBusinessBySubcategory(
    transactions,
    range,
    settings.baseCurrency,
    fxRates,
  )

  const chartData = breakdown.map((row) => ({
    name: row.subcategory,
    value: row.total,
    count: row.count,
  }))

  const totalSpend =
    sumTransactionsByCategory(transactions, range, settings.baseCurrency, fxRates).business

  return (
    <section className="space-y-8">
      <PageHeader
        title="Business spending"
        description="Track operating expenses, marketing budgets, and other business outflows."
      />
      <DateRangePicker value={range} onChange={setRange} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AddBusinessExpenseForm />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Spend by subcategory</h2>
          <p className="text-sm text-slate-400">
            Reflects expenses in {settings.baseCurrency} across the selected date range.
          </p>
          {totalSpend === 0 ? (
            <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/50 text-center text-sm text-slate-400">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={70}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={palette[index % palette.length]}
                        stroke="rgba(15, 23, 42, 0.7)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null
                      const row = payload[0].payload as (typeof chartData)[number]
                      return (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 shadow-xl">
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-slate-300">
                            {formatCurrency(row.value, settings.baseCurrency)} ·{' '}
                            {formatPercent(row.value / totalSpend)}
                          </p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {chartData.map((row, index) => (
              <li
                key={row.name}
                className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-2"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: palette[index % palette.length] }}
                  />
                  <span className="font-medium">{row.name}</span>
                </span>
                <span className="text-right text-slate-300">
                  {formatCurrency(row.value, settings.baseCurrency)} ·{' '}
                  {formatPercent(row.value / (totalSpend || 1))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Expense history</h2>
        <p className="text-sm text-slate-400">
          Detailed list of expenses. Use tags to build custom reporting in the future.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Subcategory</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {businessTransactions.map((transaction) => {
                const baseAmount =
                  sumTransactionsByCategory([transaction], range, settings.baseCurrency, fxRates)
                    .business ?? 0
                return (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{transaction.name}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {transaction.subcategory ?? 'General'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {transaction.tags?.length ? transaction.tags.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {formatCurrency(baseAmount, settings.baseCurrency)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {businessTransactions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-8 text-center text-sm text-slate-400">
              No business expenses in this range.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default BusinessPage

import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import { calculateFixedDepositAccrual } from '../lib/calc'
import { useBudgetStore } from '../lib/datastore'
import { formatCurrency } from '../lib/format'

const FixedDepositsPage = () => {
  const fixedDeposits = useBudgetStore((state) => state.fixedDeposits)
  const fxRates = useBudgetStore((state) => state.fxRates)
  const settings = useBudgetStore((state) => state.settings)

  const rows = useMemo(
    () =>
      fixedDeposits.map((position) => ({
        position,
        accrual: calculateFixedDepositAccrual(position, settings.baseCurrency, fxRates),
      })),
    [fixedDeposits, settings.baseCurrency, fxRates],
  )

  const totals = rows.reduce(
    (acc, row) => {
      acc.principal += row.accrual.principalBase
      acc.accrued += row.accrual.accruedBase
      acc.value += row.accrual.currentValueBase
      return acc
    },
    { principal: 0, accrued: 0, value: 0 },
  )

  return (
    <section className="space-y-8">
      <PageHeader
        title="Fixed deposits"
        description="Track principal balances, accrued interest, and total value at maturity."
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Positions</h2>
        <p className="text-sm text-slate-400">
          Add fixed deposits through the investment form to populate this table.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Bank</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium text-right">Principal</th>
                <th className="px-4 py-3 font-medium text-right">Accrued interest</th>
                <th className="px-4 py-3 font-medium text-right">Current value</th>
                <th className="px-4 py-3 font-medium text-right">Rate</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">Maturity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {rows.map(({ position, accrual }) => (
                <tr key={position.id}>
                  <td className="px-4 py-3">{position.bank}</td>
                  <td className="px-4 py-3 text-slate-300">{position.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(accrual.principalBase, settings.baseCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400">
                    {formatCurrency(accrual.accruedBase, settings.baseCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    {formatCurrency(accrual.currentValueBase, settings.baseCurrency)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {position.ratePct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(position.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(position.maturityDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/60 text-sm font-semibold text-slate-200">
                <td className="px-4 py-3" colSpan={2}>
                  Totals
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(totals.principal, settings.baseCurrency)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-400">
                  {formatCurrency(totals.accrued, settings.baseCurrency)}
                </td>
                <td className="px-4 py-3 text-right text-white">
                  {formatCurrency(totals.value, settings.baseCurrency)}
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  {rows.length} positions
                </td>
              </tr>
            </tfoot>
          </table>
          {rows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-8 text-center text-sm text-slate-400">
              No fixed deposits yet. Add one from the Investments page.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default FixedDepositsPage

import type { ChangeEvent, FormEvent } from 'react'
import type { Currency } from '../types/models'
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { calculateAllocation, calculateFixedDepositAccrual } from '../lib/calc'
import { createFixedDeposit, useBudgetStore } from '../lib/datastore'
import { formatCurrency } from '../lib/format'
import AllocationPie from '../components/AllocationPie'

const FixedDepositsPage = () => {
  const fixedDeposits = useBudgetStore((state) => state.fixedDeposits)
  const fxRates = useBudgetStore((state) => state.fxRates)
  const settings = useBudgetStore((state) => state.settings)
  const addFixedDeposit = useBudgetStore((state) => state.addFixedDeposit)

  const todayIso = new Date().toISOString().slice(0, 10)
  const [fdForm, setFdForm] = useState({
    bank: '',
    name: '',
    principal: '',
    rate: '',
    startDate: todayIso,
    maturityDate: todayIso,
    currency: settings.baseCurrency,
  })
  const [fdStatus, setFdStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  })


  useEffect(() => {
    setFdForm((prev) => ({ ...prev, currency: settings.baseCurrency }))
  }, [settings.baseCurrency])

  const handleFdFieldChange = (field: keyof typeof fdForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFdForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleAddFixedDeposit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFdStatus({ type: 'idle' })

    const bank = fdForm.bank.trim()
    const principal = Number(fdForm.principal)
    const ratePct = Number(fdForm.rate)
    const startDate = (fdForm.startDate || todayIso).trim()
    const maturityDate = (fdForm.maturityDate || startDate).trim()

    if (!bank) {
      setFdStatus({ type: 'error', message: 'Bank is required.' })
      return
    }
    if (!Number.isFinite(principal) || principal <= 0) {
      setFdStatus({ type: 'error', message: 'Enter a principal greater than zero.' })
      return
    }
    if (!Number.isFinite(ratePct)) {
      setFdStatus({ type: 'error', message: 'Enter a valid rate percentage.' })
      return
    }
    if (new Date(maturityDate) < new Date(startDate)) {
      setFdStatus({ type: 'error', message: 'Maturity date must be on or after the start date.' })
      return
    }

    addFixedDeposit(
      createFixedDeposit({
        bank,
        name: fdForm.name.trim() || '-',
        principal,
        ratePct,
        startDate: new Date(startDate).toISOString(),
        maturityDate: new Date(maturityDate).toISOString(),
        currency: fdForm.currency as Currency,
      }),
    )

    setFdStatus({ type: 'success', message: 'Fixed deposit added.' })
    setFdForm({
      bank: '',
      name: '',
      principal: '',
      rate: '',
      startDate,
      maturityDate,
      currency: fdForm.currency,
    })
  }

  const [viewMode, setViewMode] = useState<'bank' | 'deposit'>('bank')

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

  const allocationData = useMemo(() => {
    if (rows.length === 0) return []
    if (viewMode === 'bank') {
      const bankMap = new Map<string, number>()
      rows.forEach(({ position, accrual }) => {
        bankMap.set(
          position.bank,
          (bankMap.get(position.bank) ?? 0) + accrual.currentValueBase,
        )
      })
      const items = Array.from(bankMap.entries()).map(([bank, value]) => ({
        category: bank,
        label: bank,
        value,
      }))
      return calculateAllocation(items.filter((item) => item.value > 0))
    }

    const items = rows.map(({ position, accrual }) => {
      const name =
        position.name && position.name.trim() && position.name.trim() !== '-'
          ? position.name.trim()
          : `${position.bank} (${position.id})`
      return {
        category: position.id,
        label: name,
        value: accrual.currentValueBase,
      }
    })
    return calculateAllocation(items.filter((item) => item.value > 0))
  }, [rows, viewMode])

  const viewOptions: Array<{ value: typeof viewMode; label: string }> = [
    { value: 'bank', label: 'By bank' },
    { value: 'deposit', label: 'By deposit' },
  ]

  return (
    <section className="space-y-8">
      <PageHeader
        title="Fixed deposits"
        description="Track principal balances, accrued interest, and total value at maturity."
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Add fixed deposit</h2>
        <p className="text-sm text-slate-400">Record a new placement to keep balances and accruals up to date.</p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleAddFixedDeposit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bank</span>
            <input
              value={fdForm.bank}
              onChange={handleFdFieldChange('bank')}
              placeholder="Bank"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Label</span>
            <input
              value={fdForm.name}
              onChange={handleFdFieldChange('name')}
              placeholder="Optional name"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Principal</span>
            <input
              value={fdForm.principal}
              onChange={handleFdFieldChange('principal')}
              type="number"
              min="0"
              step="0.01"
              placeholder="10000"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rate (% p.a.)</span>
            <input
              value={fdForm.rate}
              onChange={handleFdFieldChange('rate')}
              type="number"
              step="0.01"
              placeholder="3.50"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Start date</span>
            <input
              value={fdForm.startDate}
              onChange={handleFdFieldChange('startDate')}
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maturity date</span>
            <input
              value={fdForm.maturityDate}
              onChange={handleFdFieldChange('maturityDate')}
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Currency</span>
            <select
              value={fdForm.currency}
              onChange={(event) => handleFdFieldChange('currency')(event as ChangeEvent<HTMLSelectElement>)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            >
              <option value="MYR">MYR</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <div className="md:col-span-2 flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            >
              Save deposit
            </button>
            {fdStatus.type === 'success' ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{fdStatus.message}</span>
            ) : null}
            {fdStatus.type === 'error' ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-rose-400">{fdStatus.message}</span>
            ) : null}
          </div>
        </form>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Allocation snapshot</h2>
            <p className="text-sm text-slate-400">
              Current value in {settings.baseCurrency} grouped by {viewMode === 'bank' ? 'bank' : 'individual deposit'}.
            </p>
          </div>
          <div className="inline-flex gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setViewMode(option.value)}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  viewMode === option.value
                    ? 'bg-brand-500/20 text-brand-100'
                    : 'text-slate-300 hover:text-white',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <AllocationPie data={allocationData} currency={settings.baseCurrency} />
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Positions</h2>
        <p className="text-sm text-slate-400">
          Latest placements appear here once saved above.
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
              No fixed deposits yet. Use the form above to add your first placement.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default FixedDepositsPage

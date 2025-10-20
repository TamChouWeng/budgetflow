import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SaveToFileButton from '../components/SaveToFileButton'
import {
  createSnapshot,
  importSnapshotFromFile,
  useBudgetStore,
} from '../lib/datastore'
import { formatCurrency } from '../lib/format'
import type { Category, Currency } from '../types/models'

const currencyOptions: Currency[] = ['MYR', 'USD']
const categoryOptions: Category[] = [
  'stocks',
  'crypto',
  'indexFund',
  'reit',
  'fixedDeposit',
  'epf',
  'other',
  'property',
  'business',
]
const emptyHoldingDraft = {
  name: '',
  symbol: '',
  quantity: '',
  avgCost: '',
  holdingCurrency: 'MYR' as Currency,
  notes: '',
}

const emptyTransactionDraft = {
  name: '',
  amount: '',
  currency: 'MYR' as Currency,
  date: '',
  category: 'stocks' as Category,
  subcategory: '',
  description: '',
}

const emptyFixedDepositDraft = {
  bank: '',
  name: '',
  principal: '',
  ratePct: '',
  startDate: '',
  maturityDate: '',
  currency: 'MYR' as Currency,
}

const DataManagementPage = () => {
  const holdings = useBudgetStore((state) => state.holdings)
  const transactions = useBudgetStore((state) => state.transactions)
  const fixedDeposits = useBudgetStore((state) => state.fixedDeposits)
  const settings = useBudgetStore((state) => state.settings)

  const updateHolding = useBudgetStore((state) => state.updateHolding)
  const removeHolding = useBudgetStore((state) => state.removeHolding)
  const updateTransaction = useBudgetStore((state) => state.updateTransaction)
  const removeTransaction = useBudgetStore((state) => state.removeTransaction)
  const updateFixedDeposit = useBudgetStore((state) => state.updateFixedDeposit)
  const removeFixedDeposit = useBudgetStore((state) => state.removeFixedDeposit)

  const [importStatus, setImportStatus] = useState<string | null>(null)

  const [holdingEditId, setHoldingEditId] = useState<string | null>(null)
  const [holdingDraft, setHoldingDraft] = useState(emptyHoldingDraft)
  const [holdingError, setHoldingError] = useState<string | null>(null)

  const [transactionEditId, setTransactionEditId] = useState<string | null>(null)
  const [transactionDraft, setTransactionDraft] = useState(emptyTransactionDraft)
  const [transactionError, setTransactionError] = useState<string | null>(null)

  const [fixedDepositEditId, setFixedDepositEditId] = useState<string | null>(null)
  const [fixedDepositDraft, setFixedDepositDraft] = useState(emptyFixedDepositDraft)
  const [fixedDepositError, setFixedDepositError] = useState<string | null>(null)

  const snapshot = useMemo(
    () => createSnapshot(),
    [holdings, transactions, fixedDeposits, settings],
  )

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportStatus('Importing snapshot...��')
    try {
      const imported = await importSnapshotFromFile(file)
      setImportStatus(
        `Imported ${imported.holdings.length} holdings, ${imported.transactions.length} transactions, and ${imported.fixedDeposits.length} fixed deposits`,
      )
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Unable to import snapshot')
    }
  }

  const startHoldingEdit = (id: string) => {
    const holding = holdings.find((item) => item.id === id)
    if (!holding) return
    setHoldingEditId(id)
    setHoldingDraft({
      name: holding.name ?? '',
      symbol: holding.symbol,
      quantity: holding.quantity.toString(),
      avgCost: holding.avgCost.toString(),
      holdingCurrency: holding.holdingCurrency,
      notes: holding.notes ?? '',
    })
    setHoldingError(null)
  }

  const saveHoldingEdit = () => {
    if (!holdingEditId) return
    const quantity = Number(holdingDraft.quantity)
    const avgCost = Number(holdingDraft.avgCost)
    if (Number.isNaN(quantity) || Number.isNaN(avgCost) || holdingDraft.symbol.trim().length === 0) {
      setHoldingError('Provide valid symbol, quantity, and average cost')
      return
    }
    updateHolding(holdingEditId, {
      name: holdingDraft.name || undefined,
      symbol: holdingDraft.symbol.trim().toUpperCase(),
      quantity,
      avgCost,
      holdingCurrency: holdingDraft.holdingCurrency,
      notes: holdingDraft.notes || undefined,
    })
    setHoldingEditId(null)
    setHoldingDraft(emptyHoldingDraft)
  }

  const cancelHoldingEdit = () => {
    setHoldingEditId(null)
    setHoldingDraft(emptyHoldingDraft)
    setHoldingError(null)
  }

  const startTransactionEdit = (id: string) => {
    const transaction = transactions.find((item) => item.id === id)
    if (!transaction) return
    setTransactionEditId(id)
    setTransactionDraft({
      name: transaction.name ?? '',
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      date: transaction.date.slice(0, 10),
      category: transaction.category,
      subcategory: transaction.subcategory ?? '',
      description: transaction.description ?? '',
    })
    setTransactionError(null)
  }

  const saveTransactionEdit = () => {
    if (!transactionEditId) return
    const amount = Number(transactionDraft.amount)
    if (Number.isNaN(amount) || !transactionDraft.date) {
      setTransactionError('Provide a valid amount and date')
      return
    }
    updateTransaction(transactionEditId, {
      name: transactionDraft.name || undefined,
      amount,
      currency: transactionDraft.currency,
      date: new Date(transactionDraft.date).toISOString(),
      category: transactionDraft.category,
      subcategory: transactionDraft.subcategory || undefined,
      description: transactionDraft.description || undefined,
    })
    setTransactionEditId(null)
    setTransactionDraft(emptyTransactionDraft)
  }

  const cancelTransactionEdit = () => {
    setTransactionEditId(null)
    setTransactionDraft(emptyTransactionDraft)
    setTransactionError(null)
  }

  const startFixedDepositEdit = (id: string) => {
    const fd = fixedDeposits.find((item) => item.id === id)
    if (!fd) return
    setFixedDepositEditId(id)
    setFixedDepositDraft({
      bank: fd.bank,
      name: fd.name ?? '',
      principal: fd.principal.toString(),
      ratePct: fd.ratePct.toString(),
      startDate: fd.startDate.slice(0, 10),
      maturityDate: fd.maturityDate.slice(0, 10),
      currency: fd.currency,
    })
    setFixedDepositError(null)
  }

  const saveFixedDepositEdit = () => {
    if (!fixedDepositEditId) return
    const principal = Number(fixedDepositDraft.principal)
    const ratePct = Number(fixedDepositDraft.ratePct)
    if (
      Number.isNaN(principal) ||
      Number.isNaN(ratePct) ||
      !fixedDepositDraft.startDate ||
      !fixedDepositDraft.maturityDate
    ) {
      setFixedDepositError('Provide valid principal, rate, start date, and maturity date')
      return
    }
    updateFixedDeposit(fixedDepositEditId, {
      bank: fixedDepositDraft.bank,
      name: fixedDepositDraft.name || undefined,
      principal,
      ratePct,
      startDate: new Date(fixedDepositDraft.startDate).toISOString(),
      maturityDate: new Date(fixedDepositDraft.maturityDate).toISOString(),
      currency: fixedDepositDraft.currency,
    })
    setFixedDepositEditId(null)
    setFixedDepositDraft(emptyFixedDepositDraft)
  }

  const cancelFixedDepositEdit = () => {
    setFixedDepositEditId(null)
    setFixedDepositDraft(emptyFixedDepositDraft)
    setFixedDepositError(null)
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Data management"
        description="Export encrypted JSON backups, import snapshots, or directly edit your stored investments."
      />
      {/* Export / Import */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Export data</h2>
          <p className="text-sm text-slate-400">
            Snapshots contain holdings, transactions, fixed deposits, and settings. Keep a copy in
            your secure drive or version it with Git.
          </p>
          <div className="grid gap-3 text-sm text-slate-200">
            <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
              <span>Holdings</span>
              <span className="font-semibold text-white">{holdings.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
              <span>Transactions</span>
              <span className="font-semibold text-white">{transactions.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
              <span>Fixed deposits</span>
              <span className="font-semibold text-white">{fixedDeposits.length}</span>
            </div>
          </div>
          <SaveToFileButton label="Download JSON snapshot" />
        </div>
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Import data</h2>
          <p className="text-sm text-slate-400">
            Choose a previously exported snapshot. Your current data will be replaced. Make sure
            this is intentional.
          </p>
          <label className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-400/40 bg-brand-500/5 px-6 py-10 text-center text-sm text-slate-200 transition hover:border-brand-400">
            <span className="text-base font-semibold text-white">Select snapshot to import</span>
            <span className="mt-2 text-xs text-slate-400">
              JSON exported from Budgetflow V2 (version {snapshot.version})
            </span>
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="mt-4 text-sm"
            />
          </label>
          {importStatus ? (
            <p className="text-xs font-medium text-brand-200">{importStatus}</p>
          ) : null}
        </div>
      </div>

      {/* Manage holdings */}
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Manage holdings</h2>
            <p className="text-sm text-slate-400">Edit quantities, costs, or remove holdings.</p>
          </div>
        </header>
        {holdings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
            No holdings stored yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium text-right">Quantity</th>
                  <th className="px-4 py-3 font-medium text-right">Avg cost</th>
                  <th className="px-4 py-3 font-medium">Currency</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {holdings.map((holding) => {
                  const isEditing = holdingEditId === holding.id
                  return (
                    <tr key={holding.id}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={holdingDraft.symbol}
                            onChange={(event) =>
                              setHoldingDraft((draft) => ({ ...draft, symbol: event.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs uppercase text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          <span className="font-semibold text-white">{holding.symbol}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={holdingDraft.name}
                            onChange={(event) =>
                              setHoldingDraft((draft) => ({ ...draft, name: event.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          holding.name ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            value={holdingDraft.quantity}
                            onChange={(event) =>
                              setHoldingDraft((draft) => ({
                                ...draft,
                                quantity: event.target.value,
                              }))
                            }
                            className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          holding.quantity.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4,
                          })
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            value={holdingDraft.avgCost}
                            onChange={(event) =>
                              setHoldingDraft((draft) => ({ ...draft, avgCost: event.target.value }))
                            }
                            className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          formatCurrency(holding.avgCost, holding.holdingCurrency)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={holdingDraft.holdingCurrency}
                            onChange={(event) =>
                              setHoldingDraft((draft) => ({
                                ...draft,
                                holdingCurrency: event.target.value as Currency,
                              }))
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          >
                            {currencyOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          holding.holdingCurrency
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={holdingDraft.notes}
                            onChange={(event) =>
                              setHoldingDraft((draft) => ({ ...draft, notes: event.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          holding.notes ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={saveHoldingEdit}
                              className="rounded-lg bg-brand-500 px-3 py-1 font-medium text-white hover:bg-brand-400"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelHoldingEdit}
                              className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-200 hover:border-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startHoldingEdit(holding.id)}
                              className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-200 hover:border-brand-500 hover:text-brand-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove holding ${holding.symbol}? This action cannot be undone.`,
                                  )
                                ) {
                                  removeHolding(holding.id)
                                }
                              }}
                              className="rounded-lg border border-rose-500 px-3 py-1 font-medium text-rose-300 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {holdingError ? <p className="text-xs text-rose-400">{holdingError}</p> : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Manage transactions</h2>
            <p className="text-sm text-slate-400">Update amounts, categories, or remove entries.</p>
          </div>
        </header>
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
            No transactions stored yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Currency</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Subcategory</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {transactions.map((transaction) => {
                  const isEditing = transactionEditId === transaction.id
                  return (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={transactionDraft.name}
                            onChange={(event) =>
                              setTransactionDraft((draft) => ({
                                ...draft,
                                name: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          transaction.name ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            value={transactionDraft.amount}
                            onChange={(event) =>
                              setTransactionDraft((draft) => ({
                                ...draft,
                                amount: event.target.value,
                              }))
                            }
                            className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          formatCurrency(transaction.amount, transaction.currency)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={transactionDraft.currency}
                            onChange={(event) =>
                              setTransactionDraft((draft) => ({
                                ...draft,
                                currency: event.target.value as Currency,
                              }))
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          >
                            {currencyOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          transaction.currency
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={transactionDraft.category}
                            onChange={(event) =>
                              setTransactionDraft((draft) => ({
                                ...draft,
                                category: event.target.value as Category,
                              }))
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs capitalize text-white focus:border-brand-400 focus:outline-none"
                          >
                            {categoryOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          transaction.category
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={transactionDraft.subcategory}
                            onChange={(event) =>
                              setTransactionDraft((draft) => ({
                                ...draft,
                                subcategory: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          transaction.subcategory ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {isEditing ? (
                          <input
                            type="date"
                            value={transactionDraft.date}
                            onChange={(event) =>
                              setTransactionDraft((draft) => ({
                                ...draft,
                                date: event.target.value,
                              }))
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          new Date(transaction.date).toLocaleDateString()
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={saveTransactionEdit}
                              className="rounded-lg bg-brand-500 px-3 py-1 font-medium text-white hover:bg-brand-400"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelTransactionEdit}
                              className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-200 hover:border-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startTransactionEdit(transaction.id)}
                              className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-200 hover:border-brand-500 hover:text-brand-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Remove this transaction?')) {
                                  removeTransaction(transaction.id)
                                }
                              }}
                              className="rounded-lg border border-rose-500 px-3 py-1 font-medium text-rose-300 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {transactionError ? <p className="text-xs text-rose-400">{transactionError}</p> : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Manage fixed deposits</h2>
            <p className="text-sm text-slate-400">Adjust placements or remove matured deposits.</p>
          </div>
        </header>
        {fixedDeposits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
            No fixed deposits stored yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Bank</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium text-right">Principal</th>
                  <th className="px-4 py-3 font-medium text-right">Rate (%)</th>
                  <th className="px-4 py-3 font-medium">Currency</th>
                  <th className="px-4 py-3 font-medium">Start</th>
                  <th className="px-4 py-3 font-medium">Maturity</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {fixedDeposits.map((position) => {
                  const isEditing = fixedDepositEditId === position.id
                  return (
                    <tr key={position.id}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={fixedDepositDraft.bank}
                            onChange={(event) =>
                              setFixedDepositDraft((draft) => ({ ...draft, bank: event.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          position.bank
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={fixedDepositDraft.name}
                            onChange={(event) =>
                              setFixedDepositDraft((draft) => ({ ...draft, name: event.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          position.name ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            value={fixedDepositDraft.principal}
                            onChange={(event) =>
                              setFixedDepositDraft((draft) => ({
                                ...draft,
                                principal: event.target.value,
                              }))
                            }
                            className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          formatCurrency(position.principal, position.currency)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            value={fixedDepositDraft.ratePct}
                            onChange={(event) =>
                              setFixedDepositDraft((draft) => ({ ...draft, ratePct: event.target.value }))
                            }
                            className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          position.ratePct.toFixed(2)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={fixedDepositDraft.currency}
                            onChange={(event) =>
                              setFixedDepositDraft((draft) => ({
                                ...draft,
                                currency: event.target.value as Currency,
                              }))
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          >
                            {currencyOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          position.currency
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {isEditing ? (
                          <input
                            type="date"
                            value={fixedDepositDraft.startDate}
                            onChange={(event) =>
                              setFixedDepositDraft((draft) => ({
                                ...draft,
                                startDate: event.target.value,
                              }))
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          new Date(position.startDate).toLocaleDateString()
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {isEditing ? (
                          <input
                            type="date"
                            value={fixedDepositDraft.maturityDate}
                            onChange={(event) =>
                              setFixedDepositDraft((draft) => ({
                                ...draft,
                                maturityDate: event.target.value,
                              }))
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:border-brand-400 focus:outline-none"
                          />
                        ) : (
                          new Date(position.maturityDate).toLocaleDateString()
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={saveFixedDepositEdit}
                              className="rounded-lg bg-brand-500 px-3 py-1 font-medium text-white hover:bg-brand-400"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelFixedDepositEdit}
                              className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-200 hover:border-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startFixedDepositEdit(position.id)}
                              className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-200 hover:border-brand-500 hover:text-brand-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Remove this fixed deposit?')) {
                                  removeFixedDeposit(position.id)
                                }
                              }}
                              className="rounded-lg border border-rose-500 px-3 py-1 font-medium text-rose-300 hover:bg-rose-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {fixedDepositError ? <p className="text-xs text-rose-400">{fixedDepositError}</p> : null}
      </section>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
        <h3 className="text-base font-semibold text-white">Snapshot preview</h3>
        <p className="mt-2 text-xs text-slate-400">
          Generated at {new Date(snapshot.generatedAt).toLocaleString()} · Base currency{' '}
          {settings.baseCurrency}
        </p>
        <pre className="mt-4 max-h-60 overflow-y-auto rounded-xl bg-slate-950/60 p-4 text-xs text-slate-400">
          {JSON.stringify(
            {
              holdings: snapshot.holdings.length,
              transactions: snapshot.transactions.length,
              fixedDeposits: snapshot.fixedDeposits.length,
              priceQuotes: snapshot.priceQuotes.length,
              fxRates: snapshot.fxRates.length,
            },
            null,
            2,
          )}
        </pre>
        <p className="mt-3 text-xs text-slate-400">
          Tip: Import and export also support drag-and-drop JSON onto the file input above.
        </p>
      </div>
    </section>
  )
}

export default DataManagementPage




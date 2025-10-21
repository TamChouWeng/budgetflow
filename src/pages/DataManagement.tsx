import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
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
const emptyTransactionDraft = {
  name: '',
  amount: '',
  currency: 'MYR' as Currency,
  date: '',
  category: 'stocks' as Category,
  subcategory: '',
  description: '',
}

const DataManagementPage = () => {
  const holdings = useBudgetStore((state) => state.holdings)
  const transactions = useBudgetStore((state) => state.transactions)
  const fixedDeposits = useBudgetStore((state) => state.fixedDeposits)
  const settings = useBudgetStore((state) => state.settings)

  const updateTransaction = useBudgetStore((state) => state.updateTransaction)
  const removeTransaction = useBudgetStore((state) => state.removeTransaction)

  const [importStatus, setImportStatus] = useState<string | null>(null)

  const [transactionEditId, setTransactionEditId] = useState<string | null>(null)
  const [transactionDraft, setTransactionDraft] = useState(emptyTransactionDraft)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [filterCurrency, setFilterCurrency] = useState<Currency | 'all'>('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const snapshot = useMemo(
    () => createSnapshot(),
    [holdings, transactions, fixedDeposits, settings],
  )

  const filteredTransactions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return transactions.filter((transaction) => {
      if (filterCategory !== 'all' && transaction.category !== filterCategory) return false
      if (filterCurrency !== 'all' && transaction.currency !== filterCurrency) return false
      if (filterStartDate && transaction.date < filterStartDate) return false
      if (filterEndDate && transaction.date > filterEndDate) return false
      if (search) {
        const haystack = `${transaction.name ?? ''} ${transaction.subcategory ?? ''} ${transaction.description ?? ''}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })
  }, [transactions, filterCategory, filterCurrency, filterStartDate, filterEndDate, searchTerm])

  const sortedTransactions = useMemo(() => {
    const rows = [...filteredTransactions]
    rows.sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount-desc':
          return b.amount - a.amount
        case 'amount-asc':
          return a.amount - b.amount
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })
    return rows
  }, [filteredTransactions, sortOrder])

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / rowsPerPage))
  const startItem = sortedTransactions.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
  const endItem = Math.min(currentPage * rowsPerPage, sortedTransactions.length)

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return sortedTransactions.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedTransactions, rowsPerPage, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [rowsPerPage, filterCategory, filterCurrency, filterStartDate, filterEndDate, searchTerm, sortOrder])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportStatus('Importing snapshot…')
    try {
      const imported = await importSnapshotFromFile(file)
      setImportStatus(
        `Imported ${imported.holdings.length} holdings, ${imported.transactions.length} transactions, and ${imported.fixedDeposits.length} fixed deposits`,
      )
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Unable to import snapshot')
    }
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

  const handleDownloadCsv = () => {
    if (sortedTransactions.length === 0) {
      return
    }
    const header = ['Date', 'Name', 'Category', 'Subcategory', 'Amount', 'Currency', 'Description']
    const rows = sortedTransactions.map((transaction) => [
      new Date(transaction.date).toISOString().slice(0, 10),
      transaction.name ?? '',
      transaction.category,
      transaction.subcategory ?? '',
      transaction.amount.toString(),
      transaction.currency,
      transaction.description ?? '',
    ])
    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const cell = String(value ?? '').replace(/"/g, '""')
            return `"${cell}"`
          })
          .join(','),
      )
      .join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
          <>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <label className="flex min-w-[180px] flex-col gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Search</span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Name, subcategory, description"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                  />
                </label>
                <label className="flex min-w-[160px] flex-col gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
                  <select
                    value={filterCategory}
                    onChange={(event) => setFilterCategory(event.target.value as Category | 'all')}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                  >
                    <option value="all">All</option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-[140px] flex-col gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Currency</span>
                  <select
                    value={filterCurrency}
                    onChange={(event) => setFilterCurrency(event.target.value as Currency | 'all')}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                  >
                    <option value="all">All</option>
                    {currencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">From</span>
                  <input
                    value={filterStartDate}
                    onChange={(event) => setFilterStartDate(event.target.value)}
                    type="date"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">To</span>
                  <input
                    value={filterEndDate}
                    onChange={(event) => setFilterEndDate(event.target.value)}
                    type="date"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sort</span>
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                  >
                    <option value="date-desc">Date (newest)</option>
                    <option value="date-asc">Date (oldest)</option>
                    <option value="amount-desc">Amount (high to low)</option>
                    <option value="amount-asc">Amount (low to high)</option>
                  </select>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rows</span>
                    <select
                      value={rowsPerPage}
                      onChange={(event) => setRowsPerPage(Number(event.target.value))}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    aria-label="Download CSV"
                    className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm font-semibold text-slate-100 transition hover:border-brand-500 hover:text-brand-200"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            {sortedTransactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
                No transactions match the current filters.
              </p>
            ) : (
              <div className="space-y-4">
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
                              {paginatedTransactions.map((transaction) => {
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
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>
                    Showing {startItem} to {endItem} of {sortedTransactions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:border-brand-500 hover:text-brand-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-medium text-slate-200">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages || sortedTransactions.length === 0}
                      aria-label="Next page"
                      className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200 transition hover:border-brand-500 hover:text-brand-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {transactionError ? <p className="text-xs text-rose-400">{transactionError}</p> : null}
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




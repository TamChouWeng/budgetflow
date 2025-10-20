import { useMemo, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import type { HoldingWithMetrics } from '../../lib/calc'
import { formatCurrency, formatPercent } from '../../lib/format'
import type { Currency } from '../../types/models'

interface HoldingsTableProps {
  holdings: HoldingWithMetrics[]
  baseCurrency: Currency
  isRefreshing?: boolean
  refreshingIds?: string[]
  onRefreshHolding?: (holding: HoldingWithMetrics) => void
  onRefreshAll?: () => void
}

type HoldingsSort =
  | 'name-asc'
  | 'name-desc'
  | 'type-asc'
  | 'type-desc'
  | 'value-desc'
  | 'value-asc'
  | 'pnl-desc'
  | 'pnl-asc'

const HoldingsTable = ({
  holdings,
  baseCurrency,
  isRefreshing,
  refreshingIds = [],
  onRefreshHolding,
  onRefreshAll,
}: HoldingsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | HoldingWithMetrics['category']>('all')
  const [sortOrder, setSortOrder] = useState<HoldingsSort>('value-desc')

  const filteredHoldings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return holdings.filter((holding) => {
      if (typeFilter !== 'all' && holding.category !== typeFilter) return false
      if (!search) return true
      const haystack = `${holding.name ?? ''} ${holding.symbol} ${holding.category}`.toLowerCase()
      return haystack.includes(search)
    })
  }, [holdings, searchTerm, typeFilter])

  const sortedHoldings = useMemo(() => {
    const rows = [...filteredHoldings]
    rows.sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return (a.name ?? a.symbol).localeCompare(b.name ?? b.symbol)
        case 'name-desc':
          return (b.name ?? b.symbol).localeCompare(a.name ?? a.symbol)
        case 'type-asc':
          return a.category.localeCompare(b.category)
        case 'type-desc':
          return b.category.localeCompare(a.category)
        case 'value-asc':
          return a.metrics.marketValue - b.metrics.marketValue
        case 'value-desc':
          return b.metrics.marketValue - a.metrics.marketValue
        case 'pnl-asc':
          return a.metrics.pnlValue - b.metrics.pnlValue
        case 'pnl-desc':
          return b.metrics.pnlValue - a.metrics.pnlValue
        default:
          return 0
      }
    })
    return rows
  }, [filteredHoldings, sortOrder])
  const availableCategories = useMemo(
    () => Array.from(new Set(holdings.map((holding) => holding.category))).sort(),
    [holdings],
  )


  if (!holdings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 p-12 text-center text-slate-300">
        <h3 className="text-lg font-semibold text-white">No holdings yet</h3>
        <p className="mt-2 text-sm text-slate-400">
          Add your first holding to see market values, PnL, and live refresh actions.
        </p>
      </div>
    )
  }

  if (sortedHoldings.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Holdings</h3>
            <p className="text-sm text-slate-400">
              Market value and performance in base currency ({baseCurrency})
            </p>
          </div>
          {onRefreshAll ? (
            <button
              type="button"
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-500 hover:text-brand-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh all
            </button>
          ) : null}
        </div>
        <HoldingsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          availableCategories={availableCategories}
        />
        <div className="rounded-xl border border-dashed border-slate-800/60 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
          No holdings match the current filters.
        </div>
      </div>
    )
  }

  const totalCost = sortedHoldings.reduce((acc, holding) => acc + holding.metrics.costBasis, 0)
  const totalValue = sortedHoldings.reduce((acc, holding) => acc + holding.metrics.marketValue, 0)
  const totalPnl = totalValue - totalCost

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Holdings</h3>
          <p className="text-sm text-slate-400">
            Market value and performance in base currency ({baseCurrency})
          </p>
        </div>
        {onRefreshAll ? (
          <button
            type="button"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-500 hover:text-brand-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh all
          </button>
        ) : null}
      </div>
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-4">
        <HoldingsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          availableCategories={availableCategories}
        />
      </div>
     <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Symbol</th>
              <th className="px-6 py-3 font-medium text-right">Quantity</th>
              <th className="px-6 py-3 font-medium text-right">Avg Cost</th>
              <th className="px-6 py-3 font-medium text-right">Market Value</th>
              <th className="px-6 py-3 font-medium text-right">PnL</th>
              <th className="px-6 py-3 font-medium">Last Quote</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {sortedHoldings.map((holding) => {
              const pnlColor =
                holding.metrics.pnlValue > 0
                  ? 'text-emerald-400'
                  : holding.metrics.pnlValue < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
              return (
                <tr key={holding.id} className="text-slate-200">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{holding.name ?? holding.symbol}</p>
                  </td>
                  <td className="px-6 py-4 text-xs uppercase tracking-wide text-slate-400">
                    {holding.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {holding.symbol}
                    {holding.exchange ? (
                      <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase text-slate-400">
                        {holding.exchange}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {holding.quantity.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-slate-300">
                    {formatCurrency(holding.avgCost, holding.holdingCurrency)}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-slate-100">
                    {formatCurrency(holding.metrics.marketValue, baseCurrency)}
                  </td>
                  <td className={`px-6 py-4 text-right tabular-nums font-semibold ${pnlColor}`}>
                    {formatCurrency(holding.metrics.pnlValue, baseCurrency)} (
                    {formatPercent(holding.metrics.pnlPercent)})
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div className="flex flex-col">
                      <span>
                        {formatCurrency(
                          holding.metrics.lastPrice,
                          holding.metrics.lastPriceCurrency,
                          { minimumFractionDigits: 2, maximumFractionDigits: 4 },
                        )}
                      </span>
                      {holding.lastQuote?.asOf ? (
                        <span className="text-xs text-slate-500">
                          {new Date(holding.lastQuote.asOf).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {onRefreshHolding ? (
                      <button
                        type="button"
                        onClick={() => onRefreshHolding(holding)}
                        disabled={isRefreshing || refreshingIds.includes(holding.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-brand-500 hover:text-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCcw
                          className={`h-4 w-4 ${
                            refreshingIds.includes(holding.id) ? 'animate-spin' : ''
                          }`}
                        />
                        Refresh
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900/60 text-sm font-semibold text-slate-200">
              <td className="px-6 py-4" colSpan={5}>
                Totals
              </td>
              <td className="px-6 py-4 text-right">
                {formatCurrency(totalValue, baseCurrency)}
              </td>
              <td
                className={`px-6 py-4 text-right ${
                  totalPnl > 0 ? 'text-emerald-400' : totalPnl < 0 ? 'text-rose-400' : ''
                }`}
              >
                {formatCurrency(totalPnl, baseCurrency)}
              </td>
              <td className="px-6 py-4" colSpan={2}>
                {formatCurrency(totalCost, baseCurrency)} cost basis
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

interface HoldingsFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  typeFilter: 'all' | HoldingWithMetrics['category']
  onTypeFilterChange: (value: 'all' | HoldingWithMetrics['category']) => void
  sortOrder: HoldingsSort
  onSortOrderChange: (value: HoldingsSort) => void
  availableCategories: Array<HoldingWithMetrics['category']>
}

const HoldingsFilters = ({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sortOrder,
  onSortOrderChange,
  availableCategories,
}: HoldingsFiltersProps) => {
  const sortOptions: Array<{ value: HoldingsSort; label: string }> = [
    { value: 'value-desc', label: 'Market value (high -> low)' },
    { value: 'value-asc', label: 'Market value (low -> high)' },
    { value: 'name-asc', label: 'Name (A -> Z)' },
    { value: 'name-desc', label: 'Name (Z -> A)' },
    { value: 'type-asc', label: 'Type (A -> Z)' },
    { value: 'type-desc', label: 'Type (Z -> A)' },
    { value: 'pnl-desc', label: 'PnL (high -> low)' },
    { value: 'pnl-asc', label: 'PnL (low -> high)' },
  ]

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex min-w-[200px] flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Search</span>
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Name or symbol"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        />
      </label>
      <label className="flex min-w-[160px] flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Type</span>
        <select
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(event.target.value as 'all' | HoldingWithMetrics['category'])
          }
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        >
          <option value="all">All</option>
          {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category.toUpperCase()}
              </option>
            ))}
        </select>
      </label>
      <label className="flex min-w-[200px] flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sort</span>
        <select
          value={sortOrder}
          onChange={(event) => onSortOrderChange(event.target.value as HoldingsSort)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default HoldingsTable

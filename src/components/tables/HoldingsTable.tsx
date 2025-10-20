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

const HoldingsTable = ({
  holdings,
  baseCurrency,
  isRefreshing,
  refreshingIds = [],
  onRefreshHolding,
  onRefreshAll,
}: HoldingsTableProps) => {
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

  const totalCost = holdings.reduce((acc, holding) => acc + holding.metrics.costBasis, 0)
  const totalValue = holdings.reduce((acc, holding) => acc + holding.metrics.marketValue, 0)
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
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
            {holdings.map((holding) => {
              const pnlColor =
                holding.metrics.pnlValue > 0
                  ? 'text-emerald-400'
                  : holding.metrics.pnlValue < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
              return (
                <tr key={holding.id} className="text-slate-200">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">{holding.name ?? holding.symbol}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {holding.category}
                      </p>
                    </div>
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
              <td className="px-6 py-4" colSpan={4}>
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

export default HoldingsTable

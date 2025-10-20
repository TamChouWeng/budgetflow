import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Legend,
  type LegendProps,
} from 'recharts'
import type { AllocationSlice } from '../lib/calc'
import type { Currency } from '../types/models'
import { formatCurrency, formatPercent } from '../lib/format'

const categoryColors: Record<string, string> = {
  stocks: '#287dff',
  crypto: '#f97316',
  indexFund: '#10b981',
  reit: '#a855f7',
  fixedDeposit: '#38bdf8',
  business: '#facc15',
  epf: '#f472b6',
  investment: '#14b8a6',
  other: '#c084fc',
  property: '#fbbf24',
}

const formatCategoryName = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

type ChartSlice = AllocationSlice & { displayName: string }

interface AllocationPieProps {
  data: AllocationSlice[]
  currency: Currency
}

const CustomTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartSlice }>
  currency: Currency
}) => {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0].payload
  const displayName =
    item.label ??
    (typeof item.displayName === 'string' ? item.displayName : formatCategoryName(item.category))
  const bullet = '\u00B7'
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 shadow-xl">
      <p className="font-semibold capitalize">{displayName}</p>
      <p className="text-slate-300">
        {formatCurrency(item.value, currency)} {' '} {bullet} {' '} {formatPercent(item.percentage)}
      </p>
    </div>
  )
}

const AllocationPie = ({ data, currency }: AllocationPieProps) => {
  const empty = data.every((item) => item.value === 0)
  const chartData: ChartSlice[] = data.map((item) => ({
    ...item,
    displayName: item.label ?? formatCategoryName(item.category),
  }))
  const bullet = '\u00B7'

  const legendFormatter: LegendProps['formatter'] = (value, entry) => {
    const payload = (entry as { payload?: ChartSlice })?.payload
    const displayLabel = payload?.label
      ?? payload?.displayName
      ?? (typeof value === 'string' ? value : String(value))
    const percentageText = payload ? ` ${bullet} ${formatPercent(payload.percentage)}` : ''
    return `${displayLabel}${percentageText}`
  }

  if (empty) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 text-center text-sm text-slate-400">
        No allocation data yet. Add transactions or holdings to visualise your mix.
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData as unknown as Array<Record<string, string | number>>}
            dataKey="value"
            nameKey="displayName"
            innerRadius={70}
            paddingAngle={4}
            stroke="#0f172a"
          >
            {chartData.map((entry) => {
              const key = `${entry.category}-${entry.label ?? 'total'}`
              const fill = categoryColors[entry.category] ?? '#38bdf8'
              return (
                <Cell
                  key={key}
                  fill={fill}
                  stroke="rgba(15, 23, 42, 0.6)"
                />
              )
            })}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend iconType="circle" formatter={legendFormatter} wrapperStyle={{ color: '#cbd5f5' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AllocationPie

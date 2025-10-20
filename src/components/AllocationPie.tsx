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
}

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
  payload?: Array<{ value: number; payload: AllocationSlice }>
  currency: Currency
}) => {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 shadow-xl">
      <p className="font-semibold capitalize">{item.category}</p>
      <p className="text-slate-300">
        {formatCurrency(item.value, currency)} · {formatPercent(item.percentage)}
      </p>
    </div>
  )
}

const AllocationPie = ({ data, currency }: AllocationPieProps) => {
  const empty = data.every((item) => item.value === 0)
  const chartData = data.map((item) => ({ ...item })) as Array<Record<string, string | number>>

  const legendFormatter: LegendProps['formatter'] = (value, entry) => {
    const label =
      typeof value === 'string' ? value.replace(/([A-Z])/g, ' $1').trim() : value
    const payload = (entry as { payload?: AllocationSlice })?.payload
    const percentage =
      payload && typeof payload.percentage === 'number'
        ? ` · ${formatPercent(payload.percentage)}`
        : ''
    return `${label}${percentage}`
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
            data={chartData}
            dataKey="value"
            nameKey="category"
            innerRadius={70}
            paddingAngle={4}
            stroke="#0f172a"
          >
            {data.map((entry) => (
              <Cell
                key={entry.category}
                fill={categoryColors[entry.category] ?? '#38bdf8'}
                stroke="rgba(15, 23, 42, 0.6)"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend iconType="circle" formatter={legendFormatter} wrapperStyle={{ color: '#cbd5f5' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default AllocationPie

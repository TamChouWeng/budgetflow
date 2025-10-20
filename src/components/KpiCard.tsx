interface KpiCardProps {
  label: string
  value: string
  helper?: string
  trend?: {
    label: string
    variant?: 'positive' | 'negative' | 'neutral'
  }
}

const trendClass = (variant: 'positive' | 'negative' | 'neutral' = 'neutral') => {
  if (variant === 'positive') return 'text-emerald-300'
  if (variant === 'negative') return 'text-rose-400'
  return 'text-slate-300'
}

const KpiCard = ({ label, value, helper, trend }: KpiCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_20px_45px_-25px_rgba(40,125,255,0.45)]">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
      {trend ? (
        <p className={`mt-3 text-sm font-medium ${trendClass(trend.variant)}`}>
          {trend.label}
        </p>
      ) : null}
    </div>
  )
}

export default KpiCard

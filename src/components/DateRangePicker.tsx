import { format, parseISO } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import type { DateRange } from '../types/models'
import { rangeFromPreset } from '../lib/dates'

const presets: Array<{ label: string; preset: NonNullable<DateRange['preset']> }> = [
  { label: 'Today', preset: 'TODAY' },
  { label: '7D', preset: '7D' },
  { label: 'MTD', preset: 'MTD' },
  { label: 'QTD', preset: 'QTD' },
  { label: 'YTD', preset: 'YTD' },
  { label: '1Y', preset: '1Y' },
  { label: 'Custom', preset: 'CUSTOM' },
]

const toInputValue = (value: string) => format(parseISO(value), 'yyyy-MM-dd')

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const DateRangePicker = ({ value, onChange }: DateRangePickerProps) => {
  const handlePreset = (preset: NonNullable<DateRange['preset']>) => {
    const range = preset === 'CUSTOM' ? { ...value, preset } : rangeFromPreset(preset)
    onChange(range)
  }

  const handleDateChange = (key: 'from' | 'to', date: string) => {
    const nextRange = {
      ...value,
      [key]: new Date(date).toISOString(),
      preset: 'CUSTOM' as const,
    }
    onChange(nextRange)
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-200">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Date Range</p>
            <p className="text-xs text-slate-400">Analytics update instantly</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.preset}
              type="button"
              onClick={() => handlePreset(preset.preset)}
              className={[
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                value.preset === preset.preset
                  ? 'border-brand-400 bg-brand-500/20 text-brand-100'
                  : 'border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-100',
              ].join(' ')}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      {value.preset === 'CUSTOM' ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">From</span>
            <input
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              value={toInputValue(value.from)}
              onChange={(event) => handleDateChange('from', event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">To</span>
            <input
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              value={toInputValue(value.to)}
              onChange={(event) => handleDateChange('to', event.target.value)}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}

export default DateRangePicker

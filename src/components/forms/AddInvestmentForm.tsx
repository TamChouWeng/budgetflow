import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createHolding, createTransaction, useBudgetStore } from '../../lib/datastore'
import { normalizeSymbol } from '../../lib/vendor'
import type { Category, Holding } from '../../types/models'

const investmentSchema = z
  .object({
  type: z.enum(['stocks', 'crypto', 'indexFund', 'reit', 'epf', 'other']),
    name: z.string().min(1, 'Name is required'),
    symbol: z
      .string()
      .transform((value) => value.trim())
      .optional(),
    exchange: z.enum(['US', 'MYX']).optional(),
    amount: z
      .string()
      .transform((value) => value.trim())
      .optional(),
    quantity: z
      .string()
      .transform((value) => value.trim())
      .optional(),
    pricePerUnit: z
      .string()
      .transform((value) => value.trim())
      .optional(),
    currency: z.enum(['MYR', 'USD']),
    date: z.string().min(1, 'Date is required'),
    notes: z
      .string()
      .transform((value) => value.trim())
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'stocks') {
      if (!values.symbol) {
        ctx.addIssue({
          path: ['symbol'],
          code: z.ZodIssueCode.custom,
          message: 'Symbol is required for stocks',
        })
      }
      if (!values.quantity) {
        ctx.addIssue({
          path: ['quantity'],
          code: z.ZodIssueCode.custom,
          message: 'Quantity is required for stocks',
        })
      }
    }

    const hasAmount = values.amount && !Number.isNaN(Number(values.amount))
    const hasQuantity = values.quantity && !Number.isNaN(Number(values.quantity))
    const hasPrice = values.pricePerUnit && !Number.isNaN(Number(values.pricePerUnit))
    if (!hasAmount && !(hasQuantity && hasPrice)) {
      ctx.addIssue({
        path: ['amount'],
        code: z.ZodIssueCode.custom,
        message: 'Provide an amount or (quantity � price)',
      })
    }
  })

type InvestmentFormValues = z.infer<typeof investmentSchema>

const typeLabels: Record<InvestmentFormValues['type'], string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  indexFund: 'Index Fund',
  reit: 'REIT',
  epf: 'EPF',
  other: 'Other',
}

const defaultValues: InvestmentFormValues = {
  type: 'stocks',
  name: '',
  symbol: '',
  exchange: 'US',
  amount: '',
  quantity: '',
  pricePerUnit: '',
  currency: 'MYR',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
}

const normalizeHoldingKey = (holding: Holding) => holding.symbol.trim().toUpperCase()

const AddInvestmentForm = () => {
  const holdings = useBudgetStore((state) => state.holdings)
  const addHolding = useBudgetStore((state) => state.addHolding)
  const updateHolding = useBudgetStore((state) => state.updateHolding)
  const addTransaction = useBudgetStore((state) => state.addTransaction)
  const [status, setStatus] = useState<{ type: 'idle' | 'saved' | 'error'; message?: string }>({
    type: 'idle',
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues,
  })

  const selectedType = watch('type')
  const showSecurityFields = ['stocks', 'crypto', 'indexFund', 'reit'].includes(selectedType)

  const holdingsIndex = useMemo(() => {
    const map = new Map<string, Holding>()
    holdings.forEach((holding) => {
      map.set(normalizeHoldingKey(holding), holding)
    })
    return map
  }, [holdings])

  const onSubmit = async (values: InvestmentFormValues) => {
    setStatus({ type: 'idle' })
    const parsedAmount = values.amount ? Number(values.amount) : undefined
    const parsedQuantity = values.quantity ? Number(values.quantity) : undefined
    const parsedPrice = values.pricePerUnit ? Number(values.pricePerUnit) : undefined
    const dateIso = new Date(values.date).toISOString()

    const targetAmount =
      parsedAmount ??
      (parsedQuantity && parsedPrice ? parsedQuantity * parsedPrice : undefined)

    if (!targetAmount || Number.isNaN(targetAmount)) {
      return
    }

    const transaction = createTransaction({
      category: values.type,
      date: dateIso,
      amount: targetAmount,
      currency: values.currency,
      name: values.name,
      description: values.notes,
      subcategory: values.type,
    })
    addTransaction(transaction)

    const holdingEligible = ['stocks', 'crypto', 'indexFund', 'reit'].includes(values.type)

    if (holdingEligible) {
      const { symbol, exchange } = normalizeSymbol(values.symbol ?? values.name)
      const holdingKey = symbol ?? values.name.toUpperCase()
      const normalizedKey = holdingKey.trim().toUpperCase()
      const existing = holdingsIndex.get(normalizedKey)

      if (!parsedQuantity) {
        setStatus({
          type: 'error',
          message: 'Quantity is required to add a holding',
        })
        return
      }

      const avgCost = parsedPrice ?? Number((targetAmount / parsedQuantity).toFixed(4))

      if (existing) {
        if (existing.holdingCurrency !== values.currency) {
          setStatus({
            type: 'error',
            message: `Existing holding is stored in ${existing.holdingCurrency}. Use the same currency to avoid mixing rates.`,
          })
          return
        }
        const existingCost = existing.avgCost * existing.quantity
        const newCost = avgCost * parsedQuantity
        const totalQuantity = existing.quantity + parsedQuantity
        const nextAvg = (existingCost + newCost) / totalQuantity
        updateHolding(existing.id, {
          quantity: totalQuantity,
          avgCost: Number(nextAvg.toFixed(4)),
        })
      } else {
        addHolding(
          createHolding({
            category: values.type as Extract<Category, 'stocks' | 'crypto' | 'indexFund' | 'reit'>,
            name: values.name,
            symbol: normalizedKey,
            exchange: exchange ?? values.exchange ?? 'US',
            quantity: parsedQuantity,
            avgCost: Number(avgCost.toFixed(4)),
            holdingCurrency: values.currency,
            notes: values.notes,
          }),
        )
      }
    }


    reset(defaultValues)
    setStatus({ type: 'saved' })
    setTimeout(() => setStatus({ type: 'idle' }), 4000)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-white">Add investment</h2>
        <p className="text-sm text-slate-400">
          Capture new positions or top-ups. Holdings update automatically when symbols match.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Type
          </span>
          <select
            {...register('type')}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Currency
          </span>
          <select
            {...register('currency')}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          >
            <option value="MYR">MYR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Name
          </span>
          <input
            {...register('name')}
            placeholder="Apple Inc."
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
          {errors.name ? <span className="text-xs text-rose-400">{errors.name.message}</span> : null}
        </label>
        {showSecurityFields ? (
          <>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Symbol
              </span>
              <input
                {...register('symbol')}
                placeholder="AAPL"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 uppercase text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              {errors.symbol ? (
                <span className="text-xs text-rose-400">{errors.symbol.message}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Exchange
              </span>
              <select
                {...register('exchange')}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              >
                <option value="US">United States</option>
                <option value="MYX">Bursa Malaysia</option>
              </select>
            </label>
          </>
        ) : null}
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Amount ({watch('currency')})
          </span>
          <input
            {...register('amount')}
            type="number"
            step="0.01"
            placeholder="1000"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
          {errors.amount ? (
            <span className="text-xs text-rose-400">{errors.amount.message}</span>
          ) : null}
        </label>
        {showSecurityFields ? (
          <>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Quantity
              </span>
              <input
                {...register('quantity')}
                type="number"
                step="0.0001"
                placeholder="10"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              {errors.quantity ? (
                <span className="text-xs text-rose-400">{errors.quantity.message}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Price per unit
              </span>
              <input
                {...register('pricePerUnit')}
                type="number"
                step="0.0001"
                placeholder="142"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
              />
              {errors.pricePerUnit ? (
                <span className="text-xs text-rose-400">{errors.pricePerUnit.message}</span>
              ) : null}
            </label>
          </>
        ) : null}
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Transaction date
          </span>
          <input
            {...register('date')}
            type="date"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Notes
        </span>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Optional memo or broker reference"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        />
      </label>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          ) : null}
          {isSubmitting ? 'Saving…' : 'Add investment'}
        </button>
        {status.type === 'saved' ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Saved
          </span>
        ) : null}
        {status.type === 'error' ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-rose-400">
            {status.message ?? 'Unable to save investment'}
          </span>
        ) : null}
      </div>
    </form>
  )
}

export default AddInvestmentForm


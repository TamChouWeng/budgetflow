import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createTransaction, useBudgetStore } from '../../lib/datastore'

const expenseSchema = z.object({
  name: z.string().min(1, 'Expense title is required'),
  subcategory: z.string().min(1, 'Choose or enter a subcategory'),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.enum(['MYR', 'USD']),
  date: z.string().min(1, 'Date is required'),
  description: z
    .string()
    .transform((value) => value.trim())
    .optional(),
  tags: z
    .string()
    .transform((value) => value.trim())
    .optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

const defaultValues: ExpenseFormValues = {
  name: '',
  subcategory: 'Operations',
  amount: 0,
  currency: 'MYR',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  tags: '',
}

const tagStringToArray = (input?: string) =>
  input ? input.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined

const AddBusinessExpenseForm = () => {
  const addTransaction = useBudgetStore((state) => state.addTransaction)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  })

  const onSubmit = async (values: ExpenseFormValues) => {
    addTransaction(
      createTransaction({
        category: 'business',
        date: new Date(values.date).toISOString(),
        amount: values.amount,
        currency: values.currency,
        name: values.name,
        subcategory: values.subcategory,
        description: values.description,
        tags: tagStringToArray(values.tags),
      }),
    )
    reset(defaultValues)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">Log business expense</h2>
        <p className="text-sm text-slate-400">
          Track operating, marketing, and other business activities with tags for reporting.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Expense name
          </span>
          <input
            {...register('name')}
            placeholder="Google Ads campaign"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
          {errors.name ? <span className="text-xs text-rose-400">{errors.name.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Subcategory
          </span>
          <input
            {...register('subcategory')}
            placeholder="Marketing"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
          {errors.subcategory ? (
            <span className="text-xs text-rose-400">{errors.subcategory.message}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Amount
          </span>
          <input
            {...register('amount', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="850"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
          {errors.amount ? (
            <span className="text-xs text-rose-400">{errors.amount.message}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
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
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Date
          </span>
          <input
            {...register('date')}
            type="date"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
          {errors.date ? <span className="text-xs text-rose-400">{errors.date.message}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tags (comma separated)
          </span>
          <input
            {...register('tags')}
            placeholder="marketing,q4"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Notes
        </span>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Invoice #2025-10"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
        ) : null}
        {isSubmitting ? 'Saving…' : 'Add expense'}
      </button>
    </form>
  )
}

export default AddBusinessExpenseForm

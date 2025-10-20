import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import PageHeader from '../components/PageHeader'
import { useAppSettings } from '../hooks/useSettings'
import { DATA_PROVIDERS } from '../lib/vendor'

const settingsSchema = z.object({
  baseCurrency: z.enum(['MYR', 'USD']),
  theme: z.enum(['light', 'dark']),
  vendor: z.enum(DATA_PROVIDERS.map((provider) => provider.id) as ['twelve-data', 'eodhd']),
  vendorApiKey: z
    .string()
    .transform((value) => value.trim())
    .optional(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const SettingsPage = () => {
  const { settings, updateSettings } = useAppSettings()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  })

  useEffect(() => {
    reset(settings)
  }, [settings, reset])

  const onSubmit = async (values: SettingsFormValues) => {
    updateSettings(values)
  }

  const selectedVendor = watch('vendor')

  const vendorInfo = DATA_PROVIDERS.find((provider) => provider.id === selectedVendor)

  return (
    <section className="space-y-8">
      <PageHeader
        title="Settings"
        description="Configure currency, data providers, and theme. Remember to add API keys as Netlify environment variables in production."
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
            <legend className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Base currency
            </legend>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="radio"
                value="MYR"
                {...register('baseCurrency')}
                className="h-4 w-4 border-slate-700 text-brand-500 focus:ring-brand-500/50"
              />
              <span className="flex flex-col">
                <span className="font-semibold text-white">Malaysian Ringgit (MYR)</span>
                <span className="text-xs text-slate-400">
                  Recommended if your spending and savings are majority in Malaysia.
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="radio"
                value="USD"
                {...register('baseCurrency')}
                className="h-4 w-4 border-slate-700 text-brand-500 focus:ring-brand-500/50"
              />
              <span className="flex flex-col">
                <span className="font-semibold text-white">US Dollar (USD)</span>
                <span className="text-xs text-slate-400">
                  Choose if your portfolio is primarily denominated in USD.
                </span>
              </span>
            </label>
          </fieldset>
          <fieldset className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
            <legend className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Theme
            </legend>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="radio"
                value="dark"
                {...register('theme')}
                className="h-4 w-4 border-slate-700 text-brand-500 focus:ring-brand-500/50"
              />
              <span className="font-semibold text-white">Dark mode</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="radio"
                value="light"
                {...register('theme')}
                className="h-4 w-4 border-slate-700 text-brand-500 focus:ring-brand-500/50"
              />
              <span className="font-semibold text-white">Light mode</span>
            </label>
          </fieldset>
        </div>
        <fieldset className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Market data vendor
          </legend>
          <div className="grid gap-4 md:grid-cols-2">
            {DATA_PROVIDERS.map((provider) => (
              <label
                key={provider.id}
                className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200 transition hover:border-brand-500/60"
              >
                <input
                  type="radio"
                  value={provider.id}
                  {...register('vendor')}
                  className="h-4 w-4 border-slate-700 text-brand-500 focus:ring-brand-500/50"
                />
                <span>
                  <span className="font-semibold text-white">{provider.name}</span>
                  <span className="block text-xs text-slate-400">{provider.website}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Store the API key as an environment variable on Netlify (`TWELVE_DATA_API_KEY` or
            `EODHD_API_KEY`). For local development you can keep the key here; it is stored in your
            browser&apos;s encrypted storage.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                API key
              </span>
              <input
                {...register('vendorApiKey')}
                type="password"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                placeholder={`Key for ${vendorInfo?.name ?? 'provider'}`}
              />
            </label>
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 p-3 text-xs text-slate-400">
              <p className="font-semibold text-slate-300">Heads-up</p>
              <p>
                This key is persisted locally only. If you host on Netlify, also set the key as an
                environment variable so serverless functions can access it securely.
              </p>
            </div>
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
          ) : null}
          Save changes
        </button>
      </form>
    </section>
  )
}

export default SettingsPage

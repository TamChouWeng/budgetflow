import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useBudgetStore } from '../lib/datastore'
import type { FxRate, PriceQuote } from '../types/models'

const BASE_PATH = '/.netlify/functions'

interface PriceRequest {
  symbols: string[]
  vendor: string
  apiKey?: string
}

interface FxRequest {
  base: string
  quote: string
  vendor: string
  apiKey?: string
}

const uniqueSymbols = (symbols: string[]) =>
  Array.from(
    new Set(
      symbols
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => symbol.length > 0),
    ),
  )

const fetchPrices = async (payload: PriceRequest) => {
  const response = await fetch(`${BASE_PATH}/prices-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Unable to refresh prices')
  }
  return (await response.json()) as PriceQuote[]
}

const fetchFx = async (payload: FxRequest) => {
  const params = new URLSearchParams({
    base: payload.base,
    quote: payload.quote,
    vendor: payload.vendor,
  })
  const response = await fetch(`${BASE_PATH}/fx?${params.toString()}`, {
    headers: payload.apiKey ? { 'x-api-key': payload.apiKey } : undefined,
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Unable to refresh FX rates')
  }
  return (await response.json()) as FxRate
}

export const usePrices = (
  symbols: string[],
  options?: { enabled?: boolean; refetchInterval?: number },
) => {
  const settings = useBudgetStore((state) => state.settings)
  const recordQuotes = useBudgetStore((state) => state.recordQuotes)

  const normalizedSymbols = useMemo(() => uniqueSymbols(symbols), [symbols])
  const enabled =
    (options?.enabled ?? true) && normalizedSymbols.length > 0 && !!settings.vendor

  return useQuery({
    queryKey: ['prices', settings.vendor, normalizedSymbols],
    enabled,
    queryFn: async () => {
      const payload: PriceRequest = {
        symbols: normalizedSymbols,
        vendor: settings.vendor,
      }
      if (settings.vendorApiKey) {
        payload.apiKey = settings.vendorApiKey
      }
      const quotes = await fetchPrices(payload)
      recordQuotes(quotes)
      return quotes
    },
    staleTime: 60_000,
    refetchInterval: options?.refetchInterval,
  })
}

export const useFxRate = (
  base: string,
  quote: string,
  options?: { enabled?: boolean; refetchInterval?: number },
) => {
  const settings = useBudgetStore((state) => state.settings)
  const recordFxRates = useBudgetStore((state) => state.recordFxRates)
  const enabled = (options?.enabled ?? true) && base !== quote

  return useQuery({
    queryKey: ['fx-rate', settings.vendor, base, quote],
    enabled,
    queryFn: async () => {
      const payload: FxRequest = {
        base,
        quote,
        vendor: settings.vendor,
      }
      if (settings.vendorApiKey) {
        payload.apiKey = settings.vendorApiKey
      }
      const rate = await fetchFx(payload)
      recordFxRates([rate])
      return rate
    },
    staleTime: 60_000,
    refetchInterval: options?.refetchInterval ?? 120_000,
  })
}

export const useInvalidatePrices = () => {
  const client = useQueryClient()
  const settings = useBudgetStore((state) => state.settings)
  return (symbols: string[]) =>
    client.invalidateQueries({ queryKey: ['prices', settings.vendor, uniqueSymbols(symbols)] })
}

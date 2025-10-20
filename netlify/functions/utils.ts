import type { HandlerEvent, HandlerResponse } from '@netlify/functions'

export type DataVendor = 'twelve-data' | 'eodhd'

export interface PriceQuote {
  symbol: string
  price: number
  currency: 'USD' | 'MYR'
  asOf: string
}

export interface FxRate {
  base: 'USD' | 'MYR'
  quote: 'USD' | 'MYR'
  rate: number
  asOf: string
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export const respond = (statusCode: number, body: unknown): HandlerResponse => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
})

export const isOptions = (event: HandlerEvent) => event.httpMethod === 'OPTIONS'

const cache = new Map<string, { expires: number; payload: unknown }>()

export const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key)
  if (!entry || entry.expires < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.payload as T
}

export const setCache = (key: string, payload: unknown, ttlMs: number) => {
  cache.set(key, { payload, expires: Date.now() + ttlMs })
}

export const isMyxSymbol = (symbol: string) =>
  symbol.includes(':MYX') ||
  symbol.includes('.KLSE') ||
  symbol.includes('.MYX') ||
  symbol.toUpperCase().endsWith(':MY')

export const ttlForSymbols = (symbols: string[]) =>
  symbols.some(isMyxSymbol) ? 300_000 : 60_000

export const chooseApiKey = (vendor: DataVendor, provided?: string | null) => {
  if (provided && provided.length > 0) return provided
  if (vendor === 'twelve-data') return process.env.TWELVE_DATA_API_KEY
  if (vendor === 'eodhd') return process.env.EODHD_API_KEY
  return undefined
}

export const toVendorSymbol = (vendor: DataVendor, symbol: string) => {
  const trimmed = symbol.trim().toUpperCase()
  if (vendor === 'twelve-data') {
    if (isMyxSymbol(trimmed) && !trimmed.includes(':MYX')) {
      return trimmed.replace(/(\.KLSE|\.MYX|\.KL)$/, '') + ':MYX'
    }
    return trimmed
  }
  if (vendor === 'eodhd') {
    if (isMyxSymbol(trimmed) && !trimmed.endsWith('.KLSE')) {
      return trimmed.replace(/(:MYX|\.MYX|\.KL)$/, '') + '.KLSE'
    }
    if (!trimmed.includes('.')) {
      return `${trimmed}.US`
    }
  }
  return trimmed
}

export const toPriceQuote = (
  symbol: string,
  price: number,
  currency: 'USD' | 'MYR',
): PriceQuote => ({
  symbol,
  price,
  currency,
  asOf: new Date().toISOString(),
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchWithRetry = async <T>(
  url: string,
  options: RequestInit,
  attempts = 3,
  backoffMs = 400,
): Promise<T> => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetch(url, options)
    if (response.status === 429 && attempt < attempts - 1) {
      await wait(backoffMs * (attempt + 1))
      continue
    }
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Vendor request failed with status ${response.status}`)
    }
    return (await response.json()) as T
  }
  throw new Error('Vendor request throttled')
}

export const ensureArray = (value: unknown) => {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string') return value.split(',').map((item) => item.trim())
  return []
}

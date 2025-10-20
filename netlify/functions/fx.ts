import type { Handler } from '@netlify/functions'
import {
  chooseApiKey,
  corsHeaders,
  fetchWithRetry,
  getCache,
  isOptions,
  respond,
  setCache,
  type DataVendor,
  type FxRate,
} from './utils'

interface TwelveFxResponse {
  symbol: string
  rate: string
  timestamp?: string
  message?: string
}

interface EodFxResponse {
  code: string
  close: number
  timestamp: number
  message?: string
}

const fetchTwelveFx = async (base: string, quote: string, apiKey: string) => {
  const symbol = `${base}/${quote}`
  const url = `https://api.twelvedata.com/forex_rate?symbol=${encodeURIComponent(
    symbol,
  )}&apikey=${apiKey}`
  const data = await fetchWithRetry<TwelveFxResponse>(url, { method: 'GET' })
  if (data.message) {
    throw new Error(data.message)
  }
  const numericRate = Number(data.rate)
  if (Number.isNaN(numericRate)) {
    throw new Error(`Unable to parse rate for ${symbol}`)
  }
  return {
    base: base as FxRate['base'],
    quote: quote as FxRate['quote'],
    rate: numericRate,
    asOf: (data.timestamp ? new Date(data.timestamp) : new Date()).toISOString(),
  } satisfies FxRate
}

const fetchEodFx = async (base: string, quote: string, apiKey: string) => {
  const symbol = `${base}${quote}`
  const url = `https://eodhd.com/api/real-time/forex/${symbol}?api_token=${apiKey}&fmt=json`
  const data = await fetchWithRetry<EodFxResponse>(url, { method: 'GET' })
  if (data.message) {
    throw new Error(data.message)
  }
  if (typeof data.close !== 'number') {
    throw new Error(`Unable to parse FX rate for ${symbol}`)
  }
  return {
    base: base as FxRate['base'],
    quote: quote as FxRate['quote'],
    rate: data.close,
    asOf: new Date(data.timestamp * 1000).toISOString(),
  } satisfies FxRate
}

const toCurrency = (value: string): FxRate['base'] =>
  (value === 'MYR' ? 'MYR' : 'USD') as FxRate['base']

const handler: Handler = async (event) => {
  if (isOptions(event)) {
    return { statusCode: 200, headers: corsHeaders, body: 'OK' }
  }

  const params = event.queryStringParameters ?? {}
  const base = toCurrency((params.base ?? 'USD').toUpperCase())
  const quote = toCurrency((params.quote ?? 'MYR').toUpperCase())
  if (base === quote) {
    return respond(200, {
      base,
      quote,
      rate: 1,
      asOf: new Date().toISOString(),
    } satisfies FxRate)
  }
  const vendor = (params.vendor ?? 'twelve-data') as DataVendor
  const apiKey =
    chooseApiKey(vendor, params.apiKey ?? event.headers?.['x-api-key'] ?? null) ?? ''
  if (!apiKey) {
    return respond(500, { error: 'Vendor API key is not configured' })
  }

  const cacheKey = `fx:${vendor}:${base}:${quote}`
  const cached = getCache<FxRate>(cacheKey)
  if (cached) {
    return respond(200, cached)
  }

  try {
    const rate =
      vendor === 'twelve-data'
        ? await fetchTwelveFx(base, quote, apiKey)
        : await fetchEodFx(base, quote, apiKey)
    setCache(cacheKey, rate, 300_000)
    return respond(200, rate)
  } catch (error) {
    return respond(502, {
      error: error instanceof Error ? error.message : 'Unable to fetch FX rate',
    })
  }
}

export { handler }

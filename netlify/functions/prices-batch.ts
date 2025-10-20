import type { Handler } from '@netlify/functions'
import {
  chooseApiKey,
  corsHeaders,
  ensureArray,
  getCache,
  isOptions,
  respond,
  setCache,
  toVendorSymbol,
  ttlForSymbols,
  type DataVendor,
  type PriceQuote,
} from './utils'
import { fetchPriceQuotes } from './vendor-client'

const handler: Handler = async (event) => {
  if (isOptions(event)) {
    return { statusCode: 200, headers: corsHeaders, body: 'OK' }
  }
  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' })
  }

  let payload: Record<string, unknown> = {}
  try {
    payload = event.body ? JSON.parse(event.body) : {}
  } catch (error) {
    return respond(400, { error: 'Invalid JSON payload' })
  }

  const symbols = ensureArray(payload.symbols ?? payload.symbol).filter(Boolean)
  if (symbols.length === 0) {
    return respond(400, { error: 'symbols array is required' })
  }
  const vendor = (payload.vendor ?? 'twelve-data') as DataVendor
  const apiKey =
    chooseApiKey(
      vendor,
      (payload.apiKey as string | undefined) ?? event.headers?.['x-api-key'] ?? null,
    ) ?? ''
  if (!apiKey) {
    return respond(500, { error: 'Vendor API key is not configured' })
  }

  const vendorSymbols = symbols.map((symbol) => toVendorSymbol(vendor, symbol))
  const cacheKey = `${vendor}:${vendorSymbols.sort().join(',')}`
  const cached = getCache<PriceQuote[]>(cacheKey)
  if (cached) {
    return respond(200, cached)
  }

  try {
    const quotes = await fetchPriceQuotes(vendorSymbols, vendor, apiKey, symbols)
    setCache(cacheKey, quotes, ttlForSymbols(vendorSymbols))
    return respond(200, quotes)
  } catch (error) {
    return respond(502, {
      error: error instanceof Error ? error.message : 'Unable to refresh price data',
    })
  }
}

export { handler }

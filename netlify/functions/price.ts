import type { Handler } from '@netlify/functions'
import {
  chooseApiKey,
  corsHeaders,
  getCache,
  isOptions,
  respond,
  setCache,
  toVendorSymbol,
  ttlForSymbols,
  type DataVendor,
  type PriceQuote,
  ensureArray,
} from './utils'
import { fetchPriceQuotes } from './vendor-client'

const handler: Handler = async (event) => {
  if (isOptions(event)) {
    return { statusCode: 200, headers: corsHeaders, body: 'OK' }
  }

  const params = event.queryStringParameters ?? {}
  const symbolParam = params.symbol
  if (!symbolParam) {
    return respond(400, { error: 'Missing symbol query parameter' })
  }
  const vendor = (params.vendor ?? 'twelve-data') as DataVendor
  const symbols = ensureArray(symbolParam).filter(Boolean)
  if (symbols.length === 0) {
    return respond(400, { error: 'No valid symbols provided' })
  }
  const apiKey =
    chooseApiKey(vendor, params.apiKey ?? event.headers?.['x-api-key'] ?? null) ?? ''
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
      error: error instanceof Error ? error.message : 'Unable to fetch price data',
    })
  }
}

export { handler }

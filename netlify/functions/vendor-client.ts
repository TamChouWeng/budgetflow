import {
  fetchWithRetry,
  isMyxSymbol,
  toPriceQuote,
  type DataVendor,
  type PriceQuote,
} from './utils'

interface TwelveQuoteResponse {
  symbol: string
  currency?: string
  close?: string
  last?: string
  price?: string
  datetime?: string
  message?: string
  code?: string
}

interface EodQuoteResponse {
  code: string
  close: number
  timestamp: number
  currency?: string
  message?: string
}

const fetchTwelveDataQuote = async (symbol: string, apiKey: string) => {
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
  const data = await fetchWithRetry<TwelveQuoteResponse>(url, { method: 'GET' })
  if (data.message || data.code) {
    throw new Error(data.message ?? 'Error fetching Twelve Data quote')
  }
  const numericPrice = Number(data.last ?? data.close ?? data.price)
  if (Number.isNaN(numericPrice)) {
    throw new Error(`Unable to parse price for ${symbol}`)
  }
  const currency = (data.currency ??
    (isMyxSymbol(symbol) ? 'MYR' : 'USD')) as PriceQuote['currency']
  return toPriceQuote(symbol, numericPrice, currency)
}

const fetchEodQuote = async (symbol: string, apiKey: string) => {
  const url = `https://eodhd.com/api/real-time/${encodeURIComponent(
    symbol,
  )}?api_token=${apiKey}&fmt=json`
  const data = await fetchWithRetry<EodQuoteResponse>(url, { method: 'GET' })
  if (data.message) {
    throw new Error(data.message)
  }
  if (typeof data.close !== 'number') {
    throw new Error(`EODHD did not return price for ${symbol}`)
  }
  const currency = (data.currency ??
    (isMyxSymbol(symbol) ? 'MYR' : 'USD')) as PriceQuote['currency']
  return toPriceQuote(symbol, data.close, currency)
}

export const fetchPriceQuotes = async (
  vendorSymbols: string[],
  vendor: DataVendor,
  apiKey: string,
  displaySymbols?: string[],
) => {
  const quotes = await Promise.all(
    vendorSymbols.map((vendorSymbol) =>
      vendor === 'twelve-data'
        ? fetchTwelveDataQuote(vendorSymbol, apiKey)
        : fetchEodQuote(vendorSymbol, apiKey),
    ),
  )
  return quotes.map((quote, index) => ({
    ...quote,
    symbol: displaySymbols?.[index] ?? vendorSymbols[index],
  }))
}

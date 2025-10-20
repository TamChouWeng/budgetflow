import type { DataVendor } from '../types/models'

export interface NormalizedSymbol {
  symbol: string
  exchange?: 'US' | 'MYX'
}

const MYX_SUFFIXES = [':MYX', '.MYX', '.KLSE', '.KL']
const US_SUFFIXES = ['.US', ':US', '.NYSE', '.NASDAQ']

export const normalizeSymbol = (input: string): NormalizedSymbol => {
  const trimmed = input.trim().toUpperCase()
  if (!trimmed) {
    return { symbol: '', exchange: undefined }
  }

  const myxSuffix = MYX_SUFFIXES.find((suffix) => trimmed.endsWith(suffix))
  if (myxSuffix) {
    return {
      symbol: trimmed.replace(myxSuffix, ''),
      exchange: 'MYX',
    }
  }
  const usSuffix = US_SUFFIXES.find((suffix) => trimmed.endsWith(suffix))
  if (usSuffix) {
    return {
      symbol: trimmed.replace(usSuffix, ''),
      exchange: 'US',
    }
  }
  if (trimmed.includes(':')) {
    const [symbol, exchange] = trimmed.split(':', 2)
    if (exchange === 'MYX' || exchange === 'US') {
      return { symbol, exchange }
    }
  }
  return { symbol: trimmed, exchange: /^[0-9]+$/.test(trimmed) ? 'MYX' : 'US' }
}

export const toVendorSymbol = (
  vendor: DataVendor,
  input: string,
  exchange?: 'US' | 'MYX',
) => {
  const { symbol, exchange: detected } = normalizeSymbol(input)
  const effectiveExchange = exchange ?? detected ?? 'US'
  if (vendor === 'twelve-data') {
    return effectiveExchange === 'MYX' ? `${symbol}:MYX` : symbol
  }
  if (vendor === 'eodhd') {
    return effectiveExchange === 'MYX' ? `${symbol}.KLSE` : `${symbol}.US`
  }
  return symbol
}

export const DATA_PROVIDERS: Array<{ id: DataVendor; name: string; website: string }> =
  [
    {
      id: 'twelve-data',
      name: 'Twelve Data',
      website: 'https://twelvedata.com/',
    },
    {
      id: 'eodhd',
      name: 'EOD Historical Data',
      website: 'https://eodhd.com/',
    },
  ]

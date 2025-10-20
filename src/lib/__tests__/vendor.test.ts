import { describe, expect, it } from 'vitest'
import { normalizeSymbol, toVendorSymbol } from '../vendor'

describe('normalizeSymbol', () => {
  it('handles MYX suffix', () => {
    const result = normalizeSymbol('1155:MYX')
    expect(result.symbol).toBe('1155')
    expect(result.exchange).toBe('MYX')
  })

  it('infers US listings', () => {
    const result = normalizeSymbol('aapl.us')
    expect(result.symbol).toBe('AAPL')
    expect(result.exchange).toBe('US')
  })
})

describe('toVendorSymbol', () => {
  it('formats Twelve Data MYX symbols', () => {
    expect(toVendorSymbol('twelve-data', '1155', 'MYX')).toBe('1155:MYX')
  })

  it('formats EODHD US symbols', () => {
    expect(toVendorSymbol('eodhd', 'AAPL', 'US')).toBe('AAPL.US')
  })

  it('defaults exchange when missing', () => {
    expect(toVendorSymbol('eodhd', 'MSFT')).toBe('MSFT.US')
  })
})

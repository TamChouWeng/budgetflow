export type Currency = 'MYR' | 'USD'

export type Category =
  | 'stocks'
  | 'crypto'
  | 'indexFund'
  | 'reit'
  | 'fixedDeposit'
  | 'business'

export interface DateRange {
  from: string // ISO (inclusive)
  to: string // ISO (inclusive)
  preset?: 'TODAY' | '7D' | 'MTD' | 'QTD' | 'YTD' | '1Y' | 'CUSTOM'
}

export interface Transaction {
  id: string
  date: string // ISO
  category: Category
  name?: string
  subcategory?: string
  description?: string
  amount: number
  currency: Currency
  tags?: string[]
  accountId?: string
}

export interface Holding {
  id: string
  category: Exclude<Category, 'business' | 'fixedDeposit'>
  name?: string
  symbol: string
  exchange?: string
  quantity: number
  avgCost: number
  holdingCurrency: Currency
  notes?: string
  lastQuote?: PriceQuote
}

export interface FixedDepositPosition {
  id: string
  bank: string
  name?: string
  principal: number
  ratePct: number
  startDate: string
  maturityDate: string
  currency: Currency
}

export interface PriceQuote {
  symbol: string
  price: number
  currency: Currency
  asOf: string
}

export interface FxRate {
  base: Currency
  quote: Currency
  rate: number
  asOf: string
}

export interface InvestmentInput {
  type: Exclude<Category, 'business'>
  name: string
  symbol?: string
  amount?: number
  quantity?: number
  pricePerUnit?: number
  currency: Currency
  date: string
}

export type ThemeMode = 'light' | 'dark'

export type DataVendor = 'twelve-data' | 'eodhd'

export interface AppSettings {
  baseCurrency: Currency
  theme: ThemeMode
  vendor: DataVendor
  vendorApiKey?: string
  fileHandleId?: string
}

export interface DataSnapshot {
  version: number
  generatedAt: string
  holdings: Holding[]
  transactions: Transaction[]
  fixedDeposits: FixedDepositPosition[]
  priceQuotes: PriceQuote[]
  fxRates: FxRate[]
  settings: AppSettings
  dateRange?: DateRange
}

export interface PriceServiceRequest {
  symbols: string[]
  vendor: DataVendor
  apiKey?: string
}

export type PriceServiceResponse = PriceQuote[]

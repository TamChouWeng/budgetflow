export type Currency = 'MYR' | 'USD'

export type Category =
  | 'stocks'
  | 'crypto'
  | 'indexFund'
  | 'reit'
  | 'fixedDeposit'
  | 'epf'
  | 'other'
  | 'property'
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
  name?: string // user-friendly name of the investment/expense
  subcategory?: string // optional user-defined label
  description?: string
  amount: number // positive amount spent or invested
  currency: Currency // currency of the transaction
  tags?: string[]
  accountId?: string
}

export interface Holding {
  id: string
  category: Exclude<Category, 'business' | 'fixedDeposit' | 'epf' | 'property'>
  name?: string // e.g., "Apple Inc.", "Bitcoin"
  symbol: string // e.g., AAPL, 1155:MYX, SPY
  exchange?: string // e.g., US, MYX
  quantity: number
  avgCost: number // in holdingCurrency
  holdingCurrency: Currency // USD or MYR
  notes?: string
  lastQuote?: PriceQuote // optional cached quote for quick UI
}

export interface FixedDepositPosition {
  id: string
  bank: string
  name?: string // user label for this FD
  principal: number
  ratePct: number // yearly
  startDate: string // ISO
  maturityDate: string // ISO
  currency: Currency
}

export interface PriceQuote {
  symbol: string
  price: number
  currency: Currency
  asOf: string // ISO timestamp
}

export interface FxRate {
  base: Currency
  quote: Currency
  rate: number // multiply base to get quote
  asOf: string
}

export interface InvestmentInput {
  // Unified "Add Investment" form payload
  type: Exclude<Category, 'business'>
  name: string // e.g., "AAPL", "Bitcoin", "Axis REIT", "FD at Bank A"
  symbol?: string // required for stocks; optional otherwise
  amount?: number // for non-stock investments or when tracking lump-sum
  quantity?: number // required for stocks; optional for others
  pricePerUnit?: number // optional helper; derive avgCost = amount/quantity when provided
  currency: Currency // MYR or USD
  date: string // ISO date of the transaction or placement
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

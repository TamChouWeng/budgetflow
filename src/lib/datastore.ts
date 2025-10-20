import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type {
  AppSettings,
  DataSnapshot,
  DateRange,
  FixedDepositPosition,
  FxRate,
  Holding,
  PriceQuote,
  Transaction,
} from '../types/models'
import { clampRangeToToday, defaultDateRange, rangeFromPreset } from './dates'
import { toFxRecord, getFxRateKey } from './calc'
import {
  seedHoldings,
  seedTransactions,
  seedFixedDeposits,
} from './seedData'

type FileSystemWritableFileStream = {
  write: (data: string | Uint8Array) => Promise<void>
  close: () => Promise<void>
}

type FileSystemFileHandle = {
  getFile: () => Promise<File>
  createWritable: () => Promise<FileSystemWritableFileStream>
}

type SaveFilePickerAcceptType = {
  description?: string
  accept: Record<string, string[]>
}

type SaveFilePickerOptions = {
  suggestedName?: string
  types?: SaveFilePickerAcceptType[]
}

type OpenFilePickerOptions = {
  multiple?: boolean
  types?: SaveFilePickerAcceptType[]
}

declare global {
  interface Window {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions,
    ) => Promise<FileSystemFileHandle>
    showOpenFilePicker?: (
      options?: OpenFilePickerOptions,
    ) => Promise<FileSystemFileHandle[]>
  }
}

export interface BudgetState {
  holdings: Holding[]
  transactions: Transaction[]
  fixedDeposits: FixedDepositPosition[]
  priceQuotes: Record<string, PriceQuote>
  fxRates: Record<string, FxRate>
  settings: AppSettings
  dateRange: DateRange
  addHolding: (holding: Holding) => void
  updateHolding: (id: string, updates: Partial<Holding>) => void
  removeHolding: (id: string) => void
  addTransaction: (tx: Transaction) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  removeTransaction: (id: string) => void
  addFixedDeposit: (fd: FixedDepositPosition) => void
  updateFixedDeposit: (id: string, updates: Partial<FixedDepositPosition>) => void
  removeFixedDeposit: (id: string) => void
  setSettings: (updates: Partial<AppSettings>) => void
  setDateRange: (range: DateRange) => void
  setDateRangePreset: (preset: NonNullable<DateRange['preset']>) => void
  recordQuotes: (quotes: PriceQuote[]) => void
  recordFxRates: (rates: FxRate[]) => void
  hydrate: (snapshot: DataSnapshot) => void
  reset: () => void
}

const defaultSettings: AppSettings = {
  baseCurrency: 'MYR',
  theme: 'dark',
  vendor: 'twelve-data',
}

const cloneSeedHoldings = (): Holding[] =>
  seedHoldings.map((holding) => ({ ...holding })) as Holding[]

const cloneSeedTransactions = (): Transaction[] =>
  seedTransactions.map((transaction) => ({ ...transaction })) as Transaction[]

const cloneSeedFixedDeposits = (): FixedDepositPosition[] =>
  seedFixedDeposits.map((position) => ({ ...position })) as FixedDepositPosition[]

const fallbackStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const normalizeKey = (symbol: string) => symbol.trim().toUpperCase()

const storage = createJSONStorage<BudgetState>(() => {
  if (typeof window === 'undefined') {
    return fallbackStorage
  }
  return window.localStorage as unknown as StateStorage
})

export const useBudgetStore = create<BudgetState>()(
  persist<BudgetState>(
    (set) => ({
      holdings: cloneSeedHoldings(),
      transactions: cloneSeedTransactions(),
      fixedDeposits: cloneSeedFixedDeposits(),
      priceQuotes: {},
      fxRates: {},
      settings: defaultSettings,
      dateRange: defaultDateRange(),
      addHolding: (holding) =>
        set((state) => ({
          holdings: [...state.holdings, holding],
        })),
      updateHolding: (id, updates) =>
        set((state) => ({
          holdings: state.holdings.map((holding) =>
            holding.id === id ? { ...holding, ...updates } : holding,
          ),
        })),
      removeHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((holding) => holding.id !== id),
        })),
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [...state.transactions, tx],
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction,
          ),
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        })),
      addFixedDeposit: (fd) =>
        set((state) => ({
          fixedDeposits: [...state.fixedDeposits, fd],
        })),
      updateFixedDeposit: (id, updates) =>
        set((state) => ({
          fixedDeposits: state.fixedDeposits.map((position) =>
            position.id === id ? { ...position, ...updates } : position,
          ),
        })),
      removeFixedDeposit: (id) =>
        set((state) => ({
          fixedDeposits: state.fixedDeposits.filter((position) => position.id !== id),
        })),
      setSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      setDateRange: (range) =>
        set(() => ({
          dateRange: clampRangeToToday(range),
        })),
      setDateRangePreset: (preset) =>
        set(() => ({
          dateRange: clampRangeToToday(rangeFromPreset(preset)),
        })),
      recordQuotes: (quotes) =>
        set((state) => {
          const nextQuotes = { ...state.priceQuotes }
          const updatedHoldings = state.holdings.map((holding) => {
            const incoming = quotes.find(
              (quote) => normalizeKey(quote.symbol) === normalizeKey(holding.symbol),
            )
            if (incoming) {
              nextQuotes[normalizeKey(incoming.symbol)] = incoming
              return { ...holding, lastQuote: incoming }
            }
            return holding
          })
          quotes.forEach((quote) => {
            nextQuotes[normalizeKey(quote.symbol)] = quote
          })
          return {
            holdings: updatedHoldings,
            priceQuotes: nextQuotes,
          }
        }),
      recordFxRates: (rates) =>
        set((state) => {
          const nextRates = { ...state.fxRates }
          rates.forEach((rate) => {
            nextRates[getFxRateKey(rate.base, rate.quote)] = rate
          })
          return { fxRates: nextRates }
        }),
      hydrate: (snapshot) =>
        set(() => ({
          holdings: (snapshot.holdings ?? cloneSeedHoldings()).map(
            (holding) => ({ ...holding }) as Holding,
          ),
          transactions: (snapshot.transactions ?? cloneSeedTransactions()).map(
            (transaction) => ({ ...transaction }) as Transaction,
          ),
          fixedDeposits: (snapshot.fixedDeposits ?? cloneSeedFixedDeposits()).map(
            (position) => ({ ...position }) as FixedDepositPosition,
          ),
          priceQuotes: (snapshot.priceQuotes ?? []).reduce<Record<string, PriceQuote>>(
            (acc, quote) => {
              acc[normalizeKey(quote.symbol)] = quote
              return acc
            },
            {},
          ),
          fxRates: toFxRecord(snapshot.fxRates ?? []),
          settings: { ...defaultSettings, ...snapshot.settings },
          dateRange: clampRangeToToday(snapshot.dateRange ?? defaultDateRange()),
        })),
      reset: () =>
        set(() => ({
          holdings: cloneSeedHoldings(),
          transactions: cloneSeedTransactions(),
          fixedDeposits: cloneSeedFixedDeposits(),
          priceQuotes: {},
          fxRates: {},
          settings: defaultSettings,
          dateRange: defaultDateRange(),
        })),
    }),
    {
      name: 'budgetflow-v2',
      storage,
      version: 1,
    },
  ),
)

let currentFileHandle: FileSystemFileHandle | null = null

export const getSnapshotFileHandle = () => currentFileHandle
export const setSnapshotFileHandle = (handle: FileSystemFileHandle | null) => {
  currentFileHandle = handle
}

export const createSnapshot = (state?: BudgetState): DataSnapshot => {
  const current = state ?? useBudgetStore.getState()
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    holdings: current.holdings,
    transactions: current.transactions,
    fixedDeposits: current.fixedDeposits,
    priceQuotes: Object.values(current.priceQuotes),
    fxRates: Object.values(current.fxRates),
    settings: current.settings,
    dateRange: current.dateRange,
  }
}

export const parseSnapshot = (raw: string): DataSnapshot => {
  const parsed = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid snapshot format')
  }
  if (typeof parsed.version !== 'number') {
    throw new Error('Snapshot missing version')
  }
  return parsed as DataSnapshot
}

export const importSnapshotFromFile = async (file: File) => {
  const text = await file.text()
  const snapshot = parseSnapshot(text)
  useBudgetStore.getState().hydrate(snapshot)
  return snapshot
}

const SNAPSHOT_FILE_TYPES: SaveFilePickerAcceptType[] = [
  {
    description: 'Budgetflow snapshot',
    accept: { 'application/json': ['.json'] },
  },
]

const writeSnapshotToHandle = async (
  handle: FileSystemFileHandle,
  snapshot: DataSnapshot,
) => {
  const stream = await handle.createWritable()
  await stream.write(JSON.stringify(snapshot, null, 2))
  await stream.close()
  setSnapshotFileHandle(handle)
}

export const exportSnapshotToFile = async (
  options: { suggestedName?: string; handle?: FileSystemFileHandle } = {},
) => {
  const snapshot = createSnapshot()
  const handle =
    options.handle ??
    currentFileHandle ??
    (await (async () => {
      if (typeof window === 'undefined' || !window.showSaveFilePicker) return null
      try {
        return await window.showSaveFilePicker({
          suggestedName: options.suggestedName ?? 'budgetflow-data.json',
          types: SNAPSHOT_FILE_TYPES,
        })
      } catch (error) {
        console.warn('Save file picker not available', error)
        return null
      }
    })())

  if (handle) {
    await writeSnapshotToHandle(handle, snapshot)
    return handle
  }

  if (typeof window !== 'undefined') {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = options.suggestedName ?? 'budgetflow-data.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  return null
}

export const selectBaseCurrency = () => useBudgetStore.getState().settings.baseCurrency
export const selectFxRates = () => useBudgetStore.getState().fxRates

export const upsertFxRate = (rate: FxRate) => {
  useBudgetStore.getState().recordFxRates([rate])
}

export const upsertPriceQuote = (quote: PriceQuote) => {
  useBudgetStore.getState().recordQuotes([quote])
}

export const createTransaction = (input: Omit<Transaction, 'id'>, id?: string): Transaction => ({
  ...input,
  id: id ?? crypto.randomUUID(),
})

export const createHolding = (input: Omit<Holding, 'id'>, id?: string): Holding => ({
  ...input,
  id: id ?? crypto.randomUUID(),
})

export const createFixedDeposit = (
  input: Omit<FixedDepositPosition, 'id'>,
  id?: string,
): FixedDepositPosition => ({
  ...input,
  id: id ?? crypto.randomUUID(),
})

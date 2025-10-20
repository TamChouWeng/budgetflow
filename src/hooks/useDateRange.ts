import { useBudgetStore } from '../lib/datastore'

export const useDateRange = () => {
  const range = useBudgetStore((state) => state.dateRange)
  const setRange = useBudgetStore((state) => state.setDateRange)
  const setPreset = useBudgetStore((state) => state.setDateRangePreset)

  return {
    range,
    setRange,
    setPreset,
  }
}

export const useDateRangePreset = () => {
  const setPreset = useBudgetStore((state) => state.setDateRangePreset)
  return setPreset
}

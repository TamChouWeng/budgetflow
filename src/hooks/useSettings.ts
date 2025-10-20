import { useBudgetStore } from '../lib/datastore'

export const useAppSettings = () => {
  const settings = useBudgetStore((state) => state.settings)
  const setSettings = useBudgetStore((state) => state.setSettings)

  return {
    settings,
    updateSettings: setSettings,
  }
}

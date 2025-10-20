import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useBudgetStore } from '../lib/datastore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if ((error as { status?: number }).status === 429) {
          return failureCount < 3
        }
        return failureCount < 2
      },
    },
  },
})

interface AppProvidersProps {
  children: ReactNode
}

const ThemeSynchronizer = () => {
  const theme = useBudgetStore((state) => state.settings.theme)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
  }, [theme])
  return null
}

const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeSynchronizer />
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default AppProviders

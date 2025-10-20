import { Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useBudgetStore } from '../../lib/datastore'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: () => <span className="text-xl">📊</span>,
  },
  {
    to: '/investments',
    label: 'Investments',
    icon: () => <span className="text-xl">📈</span>,
  },
  {
    to: '/business',
    label: 'Business',
    icon: () => <span className="text-xl">🏢</span>,
  },
  {
    to: '/fixed-deposits',
    label: 'Fixed Deposits',
    icon: () => <span className="text-xl">🏦</span>,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: () => <span className="text-xl">⚙️</span>,
  },
  {
    to: '/data',
    label: 'Data',
    icon: () => <span className="text-xl">💾</span>,
  },
]

const AppLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const baseCurrency = useBudgetStore((state) => state.settings.baseCurrency)

  return (
    <div className="flex h-full min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/60 px-6 py-8 md:flex md:flex-col">
        <div className="mb-10 text-xl font-semibold tracking-tight text-white">
          Budgetflow
        </div>
        <nav className="flex flex-1 flex-col gap-2 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-200'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
                ].join(' ')
              }
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-6 text-xs text-slate-500">
          Netlify-ready · Offline capable
        </p>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-100 md:hidden"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-400">
              Budgetflow
            </p>
            <h1 className="text-lg font-semibold text-slate-100">
              Investment &amp; Business Spending Tracker
            </h1>
          </div>
          <span className="hidden rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 md:inline-flex">
            Base currency: {baseCurrency}
          </span>
        </header>
        {mobileNavOpen ? (
          <nav className="grid gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-4 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-500/10 text-brand-200'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                  ].join(' ')
                }
                onClick={() => setMobileNavOpen(false)}
              >
                <item.icon />
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
        <main className="flex-1 overflow-y-auto px-4 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
